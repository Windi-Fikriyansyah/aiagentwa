import dotenv from 'dotenv';
import Joi from 'joi';
import { AppConfig, AIServiceConfig, AIProvider } from '../types';

// Load environment variables
dotenv.config();

/**
 * Environment variables validation schema
 */
const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  AI_PROVIDER: Joi.string().valid('openai', 'gemini', 'openrouter').default('openai'),
  OPENAI_API_KEY: Joi.string().allow(''),
  OPENAI_MODEL: Joi.string().default('gpt-3.5-turbo'),
  GEMINI_API_KEY: Joi.string().allow(''),
  GEMINI_MODEL: Joi.string().default('gemini-pro'),
  OPENROUTER_API_KEY: Joi.string().allow(''),
  OPENROUTER_MODEL: Joi.string().default('google/gemini-2.5-flash'),
  MAX_HISTORY_LENGTH: Joi.number().default(50),
  RESPONSE_DELAY: Joi.number().default(1000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  AI_MAX_TOKENS: Joi.number().default(150),
  AI_TEMPERATURE: Joi.number().min(0).max(2).default(0.7),
  MAYAR_API_KEY: Joi.string().allow(''),
}).unknown();

/**
 * Validate and get environment variables
 */
const validateEnv = (): void => {
  const { error } = envSchema.validate(process.env);
  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }
};

/**
 * Get application configuration
 */
export const getAppConfig = (): AppConfig => {
  validateEnv();
  const aiProvider = (process.env['AI_PROVIDER'] as AIProvider) || 'openai';
  return {
    port: parseInt(process.env['PORT'] || '3000', 10),
    aiProvider,
    openaiApiKey: process.env['OPENAI_API_KEY'],
    openaiModel: process.env['OPENAI_MODEL'],
    geminiApiKey: process.env['GEMINI_API_KEY'],
    geminiModel: process.env['GEMINI_MODEL'],
    mayarApiKey: process.env['MAYAR_API_KEY'],
    maxHistoryLength: parseInt(process.env['MAX_HISTORY_LENGTH'] || '50', 10),
    responseDelay: parseInt(process.env['RESPONSE_DELAY'] || '1000', 10),
    logLevel: process.env['LOG_LEVEL'] || 'info',
  };
};

/**
 * Get AI service configuration
 */
export const getAIServiceConfig = (): AIServiceConfig => {
  validateEnv();
  const provider = (process.env['AI_PROVIDER'] as AIProvider) || 'openai';
  let apiKey = '';
  let model = '';
  if (provider === 'openai') {
    apiKey = process.env['OPENAI_API_KEY'] || '';
    model = process.env['OPENAI_MODEL'] || 'gpt-3.5-turbo';
  } else if (provider === 'gemini') {
    apiKey = process.env['GEMINI_API_KEY'] || '';
    model = process.env['GEMINI_MODEL'] || 'gemini-pro';
  } else if (provider === 'openrouter') {
    apiKey = process.env['OPENROUTER_API_KEY'] || '';
    model = process.env['OPENROUTER_MODEL'] || 'google/gemini-2.5-flash';
  }
  return {
    provider,
    apiKey,
    model,
    maxTokens: parseInt(process.env['AI_MAX_TOKENS'] || '150', 10),
    temperature: parseFloat(process.env['AI_TEMPERATURE'] || '0.7'),
    systemPrompt: `Anda adalah Customer Service Virtual WhatsApp yang profesional, ramah, dan solutif.

Instruksi:
- Langsung jawab ke inti pertanyaan atau permintaan pengguna (to the point). Jangan selalu mengulang sapaan seperti "Halo" di setiap balasan.
- Berikan informasi yang akurat, singkat, dan berfokus pada solusi kebutuhan pelanggan.
- Gunakan format teks yang mudah dibaca polos (plain text) tanpa menggunakan tanda bintang untuk cetak tebal (contoh: jangan gunakan *teks* atau **teks**).
- Gunakan emoji yang relevan secukupnya.
- Selalu perhitungkan riwayat percakapan agar pelanggan tidak perlu mengulang informasi.
- Jika ada hal yang belum jelas, tanyakan detailnya secara sopan sebelum memberikan rekomendasi.`,
  };
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env['NODE_ENV'] === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return process.env['NODE_ENV'] === 'production';
}; 