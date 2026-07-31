import { AIResponse, WhatsAppMessage, AIServiceConfig } from '../types';
import { logger } from '../utils/logger';

// Only import OpenAI if needed
let OpenAI: any;
try {
  OpenAI = require('openai').default;
} catch {}

/**
 * AI Service for generating intelligent responses (OpenAI or Gemini)
 */
export class AIService {
  private openai: any;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    if (config.provider === 'openai') {
      this.openai = new OpenAI({ apiKey: config.apiKey });
      logger.info('AI Service initialized with OpenAI');
    } else {
      logger.info('AI Service initialized with Gemini');
    }
  }

  /**
   * Generate AI response based on chat history
   */
  async generateResponse(
    message: string,
    chatHistory: WhatsAppMessage[],
    receiverJid?: string
  ): Promise<AIResponse> {
    if (this.config.provider === 'openai') {
      return this.generateOpenAIResponse(message, chatHistory, receiverJid);
    } else {
      return this.generateGeminiResponse(message, chatHistory, receiverJid);
    }
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(
    message: string,
    chatHistory: WhatsAppMessage[],
    receiverJid?: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    logger.debug('Generating OpenAI response', { message, historyLength: chatHistory.length, receiverJid });
    try {
      const conversationContext = this.buildConversationContext(chatHistory);
      const messages = [
        { role: 'system' as const, content: this.config.systemPrompt },
        ...conversationContext,
        { role: 'user' as const, content: message },
      ];
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });
      const aiMessage = completion.choices[0]?.message?.content || 'I apologize, but I cannot generate a response at the moment.';
      const response: AIResponse = {
        message: aiMessage,
        confidence: this.calculateConfidence(completion),
        context: this.extractContext(chatHistory),
        timestamp: Date.now(),
      };
      logger.info('OpenAI response generated', { processingTime: Date.now() - startTime });
      return response;
    } catch (error) {
      logger.error('Error generating OpenAI response', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error(`Failed to generate OpenAI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate response using Gemini
   */
  private async generateGeminiResponse(
    message: string,
    chatHistory: WhatsAppMessage[],
    receiverJid?: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    logger.debug('Generating Gemini response', { message });
    try {
      // 1. Fetch device info to get custom system prompt and device ID
      let currentSystemPrompt = this.config.systemPrompt;
      let deviceId = null;

      if (receiverJid) {
        try {
          const deviceRes = await fetch(`http://localhost:3000/api/devices?jid=${receiverJid}`, {
            headers: { "x-internal-auth": "true" }
          });
          if (deviceRes.ok) {
            const devices = await deviceRes.json();
            if (devices && devices.length > 0) {
              const device = devices[0];
              deviceId = device.id;
              if (device.systemPrompt) {
                currentSystemPrompt = device.systemPrompt;
                logger.info(`Using custom system prompt for device ${device.name}`);
              }
            }
          }
        } catch (err) {
          logger.warn('Failed to fetch device info for custom prompt', { err });
        }
      }

      // 2. Fetch specific knowledge sources for this device
      let knowledgeFiles: any[] = [];
      try {
        const kbUrl = deviceId 
          ? `http://localhost:3000/api/knowledge?deviceId=${deviceId}`
          : 'http://localhost:3000/api/knowledge';
          
        const kbResponse = await fetch(kbUrl, {
          headers: { "x-internal-auth": "true" }
        });
        if (kbResponse.ok) {
          const sources = await kbResponse.json();
          knowledgeFiles = sources.filter((s: any) => s.geminiFileUri);
        }
      } catch (err) {
        logger.warn('Failed to fetch Knowledge Base sources, continuing without them', { err });
      }

      // 3. Initialize Google GenAI
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });

      // 3. Construct contents array (Files + User Message)
      // Note: User requested to ignore chat history for now.
      const contentParts: any[] = [];
      
      for (const file of knowledgeFiles) {
        let mimeType = 'application/pdf';
        const isText = file.type === 'URL' || 
                       (file.filePath && file.filePath.endsWith('.txt')) || 
                       file.name.endsWith('.txt');
                       
        if (isText) {
          mimeType = 'text/plain';
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }
        contentParts.push({
          fileData: { 
            fileUri: file.geminiFileUri, 
            mimeType 
          }
        });
      }
      
      // 3. Format chat history safely into the prompt
      let promptText = "";
      if (chatHistory.length > 0) {
        promptText += "--- CONVERSATION HISTORY ---\n";
        const recentHistory = chatHistory.slice(-8);
        for (const msg of recentHistory) {
          const isBot = msg.from === 'me' || (receiverJid && msg.from === receiverJid) || msg.from === 'system';
          const sender = isBot ? "Anda (Bot)" : "Pelanggan";
          promptText += `${sender}: ${msg.content}\n`;
        }
        promptText += "--- END HISTORY ---\n\n";
      }
      promptText += `Pesan Baru dari Pelanggan: ${message}`;
      
      contentParts.push({ text: promptText });

      // 4. Generate Content (with retry for 503 errors)
      let response;
      let retries = 3;
      let delay = 1000; // start with 1 second delay

      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: this.config.model,
            contents: contentParts,
            config: {
              systemInstruction: currentSystemPrompt,
              temperature: this.config.temperature,
              maxOutputTokens: 800, // Increased to prevent response cutoffs
            }
          });
          break; // Success, break the loop
        } catch (genErr: any) {
          if (genErr.message && (genErr.message.includes('PERMISSION_DENIED') || genErr.message.includes('not exist') || genErr.message.includes('403'))) {
            logger.warn('Gemini file access error, falling back to prompt without Knowledge Base files', { error: genErr.message });
            
            // Retry without files (only keep text parts)
            const textOnlyParts = contentParts.filter(p => p.text);
            response = await ai.models.generateContent({
              model: this.config.model,
              contents: textOnlyParts,
              config: {
                systemInstruction: currentSystemPrompt,
                temperature: this.config.temperature,
                maxOutputTokens: 800,
              }
            });
            break; // Success on fallback, break loop
          } else if (genErr.message && (genErr.message.includes('503') || genErr.message.includes('UNAVAILABLE') || genErr.message.includes('high demand'))) {
            retries--;
            if (retries === 0) throw genErr;
            logger.warn(`Gemini API overloaded (503). Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
          } else {
            throw genErr; // Other errors, throw immediately
          }
        }
      }

      const aiMessage = response.text || 'Mohon maaf, saya tidak dapat menjawab pertanyaan tersebut saat ini.';
      
      const aiResponse: AIResponse = {
        message: aiMessage,
        confidence: 0.9, 
        context: this.extractContext(chatHistory),
        timestamp: Date.now(),
      };
      
      logger.info('Gemini response generated with Knowledge Base', { 
        processingTime: Date.now() - startTime,
        kbFilesAttached: knowledgeFiles.length 
      });
      return aiResponse;
    } catch (error) {
      logger.error('Error generating Gemini response', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error(`Failed to generate Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build conversation context from chat history
   */
  private buildConversationContext(
    chatHistory: WhatsAppMessage[],
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const context: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    // Take last 10 messages for context (to avoid token limits)
    const recentHistory = chatHistory.slice(-10);
    
    for (const msg of recentHistory) {
      const role = msg.from.includes('@s.whatsapp.net') ? 'assistant' : 'user';
      const content = msg.content;
      
      if (content.trim()) {
        context.push({ role, content });
      }
    }

    return context;
  }

  /**
   * Calculate confidence score based on OpenAI response
   */
  private calculateConfidence(completion: any): number {
    // Simple confidence calculation based on finish_reason
    const finishReason = completion.choices[0]?.finish_reason;
    
    switch (finishReason) {
      case 'stop':
        return 0.9; // High confidence for complete responses
      case 'length':
        return 0.7; // Medium confidence for truncated responses
      case 'content_filter':
        return 0.5; // Lower confidence for filtered content
      default:
        return 0.6; // Default confidence
    }
  }

  /**
   * Extract relevant context from chat history
   */
  private extractContext(chatHistory: WhatsAppMessage[]): string[] {
    const topics: string[] = [];
    
    // Extract key topics from recent messages
    const recentMessages = chatHistory.slice(-5);
    
    for (const msg of recentMessages) {
      const words = msg.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 3 && !this.isCommonWord(word)) {
          topics.push(word);
        }
      });
    }
    
    return topics.slice(0, 5); // Limit to 5 topics
  }

  /**
   * Check if word is a common word
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
      'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours',
      'theirs', 'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else',
      'when', 'at', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'under',
      'over', 'inside', 'outside', 'within', 'without', 'against', 'toward',
      'towards', 'upon', 'across', 'behind', 'beneath', 'beside', 'beyond',
      'inside', 'near', 'off', 'out', 'outside', 'over', 'past', 'since',
      'through', 'throughout', 'to', 'toward', 'under', 'underneath', 'until',
      'up', 'upon', 'with', 'within', 'without'
    ];
    
    return commonWords.includes(word);
  }

  /**
   * Validate AI service configuration
   */
  validateConfig(): boolean {
    if (!this.config.apiKey) {
      logger.error(`${this.config.provider} API key is required`);
      return false;
    }
    
    if (!this.config.model) {
      logger.error(`${this.config.provider} model is required`);
      return false;
    }
    
    return true;
  }

  /**
   * Test AI service connectivity
   */
  async testConnection(): Promise<boolean> {
    if (this.config.provider === 'openai') {
      try {
        await this.openai.models.list();
        logger.info('OpenAI service connection test successful');
        return true;
      } catch (error) {
        logger.error('OpenAI service connection test failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        return false;
      }
    } else {
      // For Gemini, just check if API key is set
      if (this.config.apiKey) {
        logger.info('Gemini service connection test (API key present)');
        return true;
      } else {
        logger.error('Gemini service connection test failed: API key missing');
        return false;
      }
    }
  }
} 