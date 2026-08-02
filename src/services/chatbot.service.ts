import { WhatsAppService } from './whatsapp.service';
import { AIService } from './ai.service';
import { ChatHistoryService } from './chat-history.service';
import { WebSocketService } from './websocket.service';
import { WhatsAppMessage, MessageProcessingResult, ConnectionStatus } from '../types';
import { logger } from '../utils/logger';

import { MayarService, FollowUpTask } from './mayar.service';

/**
 * Main Chatbot Service that orchestrates all components
 */
export class ChatbotService {
  private whatsappService: WhatsAppService;
  private aiService: AIService;
  private chatHistoryService: ChatHistoryService;
  private webSocketService: WebSocketService;
  private mayarService: MayarService;
  private isProcessing: boolean = false;
  private responseDelay: number;

  constructor(
    whatsappService: WhatsAppService,
    aiService: AIService,
    chatHistoryService: ChatHistoryService,
    webSocketService: WebSocketService,
    mayarService: MayarService,
    responseDelay: number = 1000
  ) {
    this.whatsappService = whatsappService;
    this.aiService = aiService;
    this.chatHistoryService = chatHistoryService;
    this.webSocketService = webSocketService;
    this.mayarService = mayarService;
    this.responseDelay = responseDelay;

    this.setupEventHandlers();
    
    // Allow HTTP API to trigger manual messages
    this.webSocketService.setOnSendMessage(async (chatId, message) => {
      const sent = await this.sendManualMessage(chatId, message);
      if (sent) {
        // Mock a bot message to sync to DB and WS
        const botMessage: WhatsAppMessage = {
          id: `manual-${Date.now()}`,
          from: this.whatsappService.getUser()?.id?.replace(/:\d+/, '') || 'unknown',
          to: chatId,
          timestamp: Date.now(),
          type: 'text',
          content: message,
          isGroup: chatId.endsWith('@g.us'),
          senderName: 'Admin',
        };
        this.chatHistoryService.addMessage(chatId, botMessage);
        this.webSocketService.sendMessageSent(botMessage);
        this.syncMessageToDb(botMessage, "human");
      }
      return sent;
    });
    
    logger.info('Chatbot Service initialized');
  }

  /**
   * Setup event handlers for all services
   */
  private setupEventHandlers(): void {
    // WhatsApp message handler
    this.whatsappService.onMessage((message: WhatsAppMessage) => {
      this.handleIncomingMessage(message);
    });

    // WhatsApp connection status handler
    this.whatsappService.onConnectionStatusChange((status: ConnectionStatus) => {
      const user = this.whatsappService.getUser();
      this.webSocketService.sendConnectionStatus(status, user);
      logger.info('WhatsApp connection status changed', { status, hasUser: !!user });
    });

    // WhatsApp QR code handler
    this.whatsappService.onQRGenerated((qr: string) => {
      this.webSocketService.sendQRGenerated(qr);
      logger.info('WhatsApp QR code broadcasted via WebSocket');
    });

    // Mayar Follow-up Handler
    this.mayarService.setFollowUpHandler(async (task: FollowUpTask) => {
      logger.info(`Generating follow-up message for ${task.customerName} (${task.productName})`);
      const prompt = `Buat sebuah pesan pengingat pembayaran (follow-up) WhatsApp yang ramah dan sopan untuk pelanggan.
Detail Transaksi:
Nama: ${task.customerName}
Produk: ${task.productName}
Nominal: Rp ${task.amount.toLocaleString('id-ID')}
Link Pembayaran: ${task.paymentUrl}

Gunakan sapaan hangat, ingatkan bahwa pesanan belum dibayar, berikan link pembayaran, dan tawarkan bantuan jika ada kesulitan. Jangan terlalu kaku.`;
      
      const aiResponse = await this.aiService.generateResponse(prompt, []);
      if (aiResponse && aiResponse.message) {
        await this.whatsappService.sendMessage(task.customerMobile, aiResponse.message);
        
        // Mock a bot message to sync to DB and WS
        const botMessage: WhatsAppMessage = {
          id: `mayar-${task.transactionId}-${Date.now()}`,
          from: this.whatsappService.getUser()?.id?.replace(/:\d+/, '') || 'unknown',
          to: task.customerMobile,
          timestamp: Date.now(),
          type: 'text',
          content: aiResponse.message,
          isGroup: false,
          senderName: 'AI Follow Up',
        };
        this.chatHistoryService.addMessage(task.customerMobile, botMessage);
        this.webSocketService.sendMessageSent(botMessage);
        await this.syncMessageToDb(botMessage, "ai");
      }
    });
  }

  /**
   * Initialize the chatbot
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing chatbot...');

      // Initialize WebSocket service
      this.webSocketService.initialize();

      // Initialize WhatsApp service
      await this.whatsappService.initialize();

      // Initialize Mayar Service (Cron)
      this.mayarService.startCron();

      // Test AI service connection
      const aiConnected = await this.aiService.testConnection();
      if (!aiConnected) {
        throw new Error('AI service connection failed');
      }

      logger.info('Chatbot initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize chatbot', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Handle incoming WhatsApp message
   */
  private async handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
    if (this.isProcessing) {
      logger.warn('Message processing already in progress, skipping');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      logger.info('Processing incoming message', { 
        from: message.from, 
        content: message.content.substring(0, 50) 
      });

      // Notify WebSocket clients
      this.webSocketService.sendMessageReceived(message);

      // Add message to chat history
      this.chatHistoryService.addMessage(message.to, message);
      
      // Sync incoming message to database
      this.syncMessageToDb(message, "user");

      // Process message and generate response
      logger.info('About to process message with AI service');
      const result = await this.processMessage(message);
      logger.info('AI processing result', { success: result.success, hasResponse: !!result.response, error: result.error });

      if (result.success && result.response) {
        // Add delay to simulate human-like response
        await this.delay(this.responseDelay);

        // Send response via WhatsApp
        logger.info('Sending AI response via WhatsApp');
        const sent = await this.whatsappService.sendMessage(message.from, result.response);

        if (sent) {
          // Add bot response to chat history
          const botMessage: WhatsAppMessage = {
            id: `bot-${Date.now()}`,
            from: message.to,
            to: message.from,
            timestamp: Date.now(),
            type: 'text',
            content: result.response,
            isGroup: message.isGroup,
            groupId: message.groupId || undefined,
            senderName: 'AI Assistant',
          };

          this.chatHistoryService.addMessage(message.to, botMessage);
          this.webSocketService.sendMessageSent(botMessage);
          
          // Sync bot message to database (and update leadStatus!)
          this.syncMessageToDb(botMessage, "ai", result.leadStatus);

          logger.info('Response sent successfully', { 
            to: message.from, 
            responseLength: result.response.length 
          });
        } else {
          logger.error('Failed to send WhatsApp response');
        }
      } else {
        logger.error('Message processing failed', { error: result.error });
        this.webSocketService.sendError({ 
          message: 'Failed to process message', 
          error: result.error 
        });
      }

      const processingTime = Date.now() - startTime;
      logger.info('Message processing completed', { processingTime });

    } catch (error) {
      logger.error('Error processing message', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      this.webSocketService.sendError({ 
        message: 'Error processing message', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process message and generate AI response
   */
  private async processMessage(message: WhatsAppMessage): Promise<MessageProcessingResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting AI message processing');
      
      // Get chat history for context
      const chatHistory = this.chatHistoryService.getConversationContext(message.to);
      logger.info('Retrieved chat history', { historyLength: chatHistory.length });

      // Generate response using AI Service
      logger.info('Calling AI service generateResponse');
      const aiResponse = await this.aiService.generateResponse(
        message.content,
        chatHistory,
        message.to
      );
      logger.info('AI response generated successfully', { responseLength: aiResponse.message.length });

      // Notify WebSocket clients about AI response
      this.webSocketService.sendAIResponseGenerated(aiResponse);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        response: aiResponse.message,
        leadStatus: aiResponse.leadStatus || 'cold',
        processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Error in processMessage', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      };
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sync message to database via API
   */
  private async syncMessageToDb(message: WhatsAppMessage, sender: "user" | "ai" | "human", leadStatus?: 'hot' | 'warm' | 'cold'): Promise<void> {
    try {
      const user = this.whatsappService.getUser();
      if (!user || !user.id) return;
      
      const deviceJid = user.id.replace(/:\d+/, ''); // Strip device id suffix e.g. :1
      const customerJid = sender === "user" ? message.from : message.to;
      const customerName = sender === "user" ? message.senderName : undefined;

      const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';
      fetch(`${frontendUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-auth': process.env['INTERNAL_AUTH_SECRET'] || 'true'
        },
        body: JSON.stringify({
          deviceJid,
          customerJid,
          customerName,
          leadStatus,
          message: {
            ...message,
            sender
          }
        })
      }).catch(err => {
        logger.error('API call to sync message failed', { error: err.message });
      });
    } catch (error) {
      logger.error('Failed to prepare message sync', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get chatbot status
   */
  getStatus(): {
    whatsappConnected: boolean;
    aiServiceConnected: boolean;
    webSocketClients: number;
    isProcessing: boolean;
    totalChats: number;
    totalMessages: number;
  } {
    return {
      whatsappConnected: this.whatsappService.isConnected(),
      aiServiceConnected: this.aiService.validateConfig(),
      webSocketClients: this.webSocketService.getConnectedClientsCount(),
      isProcessing: this.isProcessing,
      totalChats: this.chatHistoryService.getTotalChats(),
      totalMessages: this.chatHistoryService.getTotalMessages(),
    };
  }

  /**
   * Send manual message (for testing)
   */
  async sendManualMessage(chatId: string, message: string): Promise<boolean> {
    return await this.whatsappService.sendMessage(chatId, message);
  }

  /**
   * Get chat history for a specific chat
   */
  getChatHistory(chatId: string): WhatsAppMessage[] {
    return this.chatHistoryService.getChatHistory(chatId);
  }

  /**
   * Clear chat history
   */
  clearChatHistory(chatId: string): void {
    this.chatHistoryService.clearChatHistory(chatId);
  }

  /**
   * Search messages in chat history
   */
  searchMessages(chatId: string, query: string): WhatsAppMessage[] {
    return this.chatHistoryService.searchMessages(chatId, query);
  }

  /**
   * Export chat history
   */
  exportChatHistory(chatId: string): string | null {
    return this.chatHistoryService.exportChatHistory(chatId);
  }

  /**
   * Import chat history
   */
  importChatHistory(chatId: string, jsonData: string): boolean {
    return this.chatHistoryService.importChatHistory(chatId, jsonData);
  }

  /**
   * Cleanup old chat histories
   */
  cleanupOldHistories(daysOld: number = 30): number {
    return this.chatHistoryService.cleanupOldHistories(daysOld);
  }

  /**
   * Shutdown chatbot
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down chatbot...');

    try {
      await this.whatsappService.disconnect();
      this.webSocketService.close();
      this.mayarService.stopCron();
      
      logger.info('Chatbot shutdown completed');
    } catch (error) {
      logger.error('Error during chatbot shutdown', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
} 