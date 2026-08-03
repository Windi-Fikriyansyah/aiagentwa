import { WhatsAppSession } from './whatsapp.session';
import { WhatsAppMessage, ConnectionStatus } from '../types';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * WhatsApp Service for managing multiple WhatsApp Web sessions
 */
export class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private messageHandlers: Array<(deviceId: string, message: WhatsAppMessage) => void> = [];
  private statusHandlers: Array<(deviceId: string, status: ConnectionStatus) => void> = [];
  private qrHandlers: Array<(deviceId: string, qr: string) => void> = [];

  constructor() {
    logger.info('WhatsApp Service Manager initialized');
  }

  /**
   * Register a handler for QR code generation
   */
  public onQRGenerated(handler: (deviceId: string, qr: string) => void): void {
    this.qrHandlers.push(handler);
  }

  /**
   * Add message handler
   */
  public onMessage(handler: (deviceId: string, message: WhatsAppMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Add connection status handler
   */
  public onConnectionStatusChange(handler: (deviceId: string, status: ConnectionStatus) => void): void {
    this.statusHandlers.push(handler);
  }

  /**
   * Start a new or existing session
   */
  public async startSession(deviceId: string): Promise<WhatsAppSession> {
    if (this.sessions.has(deviceId)) {
      logger.info(`Session ${deviceId} already exists`);
      return this.sessions.get(deviceId)!;
    }

    const session = new WhatsAppSession(deviceId);
    this.sessions.set(deviceId, session);

    // Forward events
    session.onMessage((id, msg) => {
      this.messageHandlers.forEach(handler => handler(id, msg));
    });
    session.onConnectionStatusChange((id, status) => {
      this.statusHandlers.forEach(handler => handler(id, status));
    });
    session.onQRGenerated((id, qr) => {
      this.qrHandlers.forEach(handler => handler(id, qr));
    });

    await session.initialize();
    return session;
  }

  /**
   * Get a specific session
   */
  public getSession(deviceId: string): WhatsAppSession | undefined {
    return this.sessions.get(deviceId);
  }

  /**
   * Initialize WhatsApp connection manager and start all existing sessions
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing all WhatsApp sessions...');
      const sessionsPath = path.resolve(__dirname, '../../.whatsapp-sessions');
      
      if (!fs.existsSync(sessionsPath)) {
        fs.mkdirSync(sessionsPath, { recursive: true });
        logger.info('Created .whatsapp-sessions directory');
        
        // Also start a default session to keep backward compatibility 
        // with UI if they don't explicitly pass a deviceId yet.
        await this.startSession('default-device');
      } else {
        const directories = fs.readdirSync(sessionsPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        if (directories.length === 0) {
           await this.startSession('default-device');
        }

        for (const deviceId of directories) {
          await this.startSession(deviceId);
        }
      }
      
      logger.info('WhatsApp service manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp service manager', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Send message to a specific chat via a specific device
   */
  async sendMessage(deviceId: string, chatId: string, message: string): Promise<boolean> {
    const session = this.sessions.get(deviceId);
    if (!session) {
      logger.error(`Session ${deviceId} not found`);
      return false;
    }
    return await session.sendMessage(chatId, message);
  }

  /**
   * Get logged-in user information for a device
   */
  getUser(deviceId: string): any {
    return this.sessions.get(deviceId)?.getUser() || null;
  }

  /**
   * Get current connection status for a device
   */
  getConnectionStatus(deviceId: string): ConnectionStatus {
    return this.sessions.get(deviceId)?.getConnectionStatus() || ConnectionStatus.DISCONNECTED;
  }

  /**
   * Check if WhatsApp is connected for a device
   */
  isConnected(deviceId: string): boolean {
    return this.sessions.get(deviceId)?.isConnected() || false;
  }

  /**
   * Disconnect WhatsApp for a device
   */
  async disconnect(deviceId: string, isLogout: boolean = false): Promise<void> {
    const session = this.sessions.get(deviceId);
    if (session) {
      await session.disconnect(isLogout);
      this.sessions.delete(deviceId);
    }
  }

  /**
   * Disconnect all devices
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.sessions.values()).map(session => session.disconnect(false));
    await Promise.all(disconnectPromises);
    this.sessions.clear();
  }

  /**
   * Get chat participants (for group chats)
   */
  async getChatParticipants(deviceId: string, chatId: string): Promise<string[]> {
    const session = this.sessions.get(deviceId);
    if (!session) return [];
    return await session.getChatParticipants(chatId);
  }

  /**
   * Delete device from Database and local storage
   */
  async deleteSession(deviceId: string): Promise<void> {
    await this.disconnect(deviceId, true);
    const sessionPath = path.resolve(__dirname, `../../.whatsapp-sessions/${deviceId}`);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
  }
}