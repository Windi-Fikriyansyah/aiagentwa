import { 
  default as makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket,
  proto 
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { WhatsAppMessage, ConnectionStatus } from '../types';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

/**
 * WhatsApp Session for handling a single WhatsApp Web connection
 */
export class WhatsAppSession {
  private sock: WASocket | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private messageHandlers: Array<(deviceId: string, message: WhatsAppMessage) => void> = [];
  private statusHandlers: Array<(deviceId: string, status: ConnectionStatus) => void> = [];
  private qrHandlers: Array<(deviceId: string, qr: string) => void> = [];
  private isShuttingDown: boolean = false;
  private deviceId: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    logger.info(`WhatsApp Session initialized for device: ${deviceId}`);
    
    // Graceful shutdown: prevent session deletion on PM2 restart
    process.on('SIGTERM', () => {
      this.isShuttingDown = true;
    });
    process.on('SIGINT', () => {
      this.isShuttingDown = true;
    });
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public onQRGenerated(handler: (deviceId: string, qr: string) => void): void {
    this.qrHandlers.push(handler);
  }

  public onMessage(handler: (deviceId: string, message: WhatsAppMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  public onConnectionStatusChange(handler: (deviceId: string, status: ConnectionStatus) => void): void {
    this.statusHandlers.push(handler);
  }

  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    logger.info(`Connection status changed for device ${this.deviceId}`, { status });
    
    this.statusHandlers.forEach(handler => {
      try {
        handler(this.deviceId, status);
      } catch (error) {
        logger.error(`Error in status handler for device ${this.deviceId}`, { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      logger.info(`Initializing WhatsApp connection for device ${this.deviceId}...`);
      this.updateConnectionStatus(ConnectionStatus.CONNECTING);

      const sessionPath = path.resolve(__dirname, `../../.whatsapp-sessions/${this.deviceId}`);
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }
      logger.info('WhatsApp session path', { sessionPath, exists: fs.existsSync(sessionPath) });
      
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['AgentFlow AI', 'Chrome', '1.0.0'],
      });

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          logger.info(`QR Code received for device ${this.deviceId}`);
          qrcode.generate(qr, { small: true });
          
          this.qrHandlers.forEach(handler => {
            try {
              handler(this.deviceId, qr);
            } catch (error) {
              logger.error(`Error in QR handler for device ${this.deviceId}`, { error: error instanceof Error ? error.message : 'Unknown error' });
            }
          });
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          logger.info(`Connection closed for device ${this.deviceId}`, { 
            reason: lastDisconnect?.error, 
            statusCode,
            shouldReconnect,
            isShuttingDown: this.isShuttingDown
          });

          if (this.isShuttingDown) {
            logger.info('Shutdown in progress, preserving session files');
            return;
          }

          if (shouldReconnect) {
            this.updateConnectionStatus(ConnectionStatus.CONNECTING);
            await this.initialize();
          } else {
            logger.info(`Device ${this.deviceId} logged out or removed. Clearing session and restarting for new QR...`);
            this.updateConnectionStatus(ConnectionStatus.DISCONNECTED);
            
            try {
              const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';
              await fetch(`${frontendUrl}/api/devices?jid=${this.deviceId}`, {
                method: 'DELETE',
                headers: { 'x-internal-auth': process.env['INTERNAL_AUTH_SECRET'] || 'true' }
              });
              logger.info(`Device record deleted from database for ${this.deviceId}`);
            } catch (dbErr) {
              logger.error(`Failed to delete device ${this.deviceId} from database`, { error: dbErr instanceof Error ? dbErr.message : 'Unknown' });
            }

            if (fs.existsSync(sessionPath)) {
              fs.rmSync(sessionPath, { recursive: true, force: true });
              logger.info(`Old session deleted for device ${this.deviceId}`);
            }

            setTimeout(async () => {
              this.updateConnectionStatus(ConnectionStatus.CONNECTING);
              await this.initialize();
            }, 2000);
          }
        } else if (connection === 'open') {
          logger.info(`WhatsApp connection established for device ${this.deviceId}`);
          this.updateConnectionStatus(ConnectionStatus.READY);
        }
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        
        if (msg && !msg.key.fromMe && msg.message) {
          const whatsappMessage = this.parseMessage(msg);
          if (whatsappMessage) {
            logger.info(`Message received on device ${this.deviceId}`, { 
              from: whatsappMessage.from, 
              content: whatsappMessage.content.substring(0, 50) 
            });
            
            this.messageHandlers.forEach(handler => {
              try {
                handler(this.deviceId, whatsappMessage);
              } catch (error) {
                logger.error(`Error in message handler for device ${this.deviceId}`, { error: error instanceof Error ? error.message : 'Unknown error' });
              }
            });
          }
        }
      });

      logger.info(`WhatsApp session initialized successfully for device ${this.deviceId}`);
    } catch (error) {
      logger.error(`Failed to initialize WhatsApp session for device ${this.deviceId}`, { error: error instanceof Error ? error.message : 'Unknown error' });
      this.updateConnectionStatus(ConnectionStatus.DISCONNECTED);
      throw error;
    }
  }

  async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.sock || this.connectionStatus !== ConnectionStatus.READY) {
      logger.error(`WhatsApp not connected for device ${this.deviceId}`);
      return false;
    }

    try {
      await this.sock.sendMessage(chatId, { text: message });
      logger.info('Message sent successfully', { deviceId: this.deviceId, chatId, messageLength: message.length });
      return true;
    } catch (error) {
      logger.error('Failed to send message', { 
        deviceId: this.deviceId,
        chatId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  private parseMessage(msg: proto.IWebMessageInfo): WhatsAppMessage | null {
    try {
      const messageType = this.getMessageType(msg.message || undefined);
      const content = this.extractMessageContent(msg.message || undefined);
      
      if (!content) return null;
      if (!msg.key) return null;

      const isGroup = msg.key.remoteJid?.endsWith('@g.us') || false;
      const groupId = isGroup ? msg.key.remoteJid : undefined;

      return {
        id: msg.key.id || '',
        from: msg.key.participant || msg.key.remoteJid || '',
        to: msg.key.remoteJid || '',
        timestamp: msg.messageTimestamp ? (msg.messageTimestamp as number) * 1000 : Date.now(),
        type: messageType,
        content,
        isGroup,
        groupId: groupId || undefined,
        senderName: msg.pushName || undefined,
        deviceId: this.deviceId, // attached deviceId
      };
    } catch (error) {
      logger.error(`Error parsing message on device ${this.deviceId}`, { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  private extractMessageContent(message: proto.IMessage | undefined): string | null {
    if (!message) return null;

    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;
    if (message.documentMessage?.title) return message.documentMessage.title;

    return null;
  }

  private getMessageType(message: proto.IMessage | undefined): WhatsAppMessage['type'] {
    if (!message) return 'text';

    if (message.conversation || message.extendedTextMessage) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.locationMessage) return 'location';
    if (message.contactMessage) return 'contact';

    return 'text';
  }

  getUser(): any {
    return this.sock?.user || null;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === ConnectionStatus.READY;
  }

  async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }
    this.updateConnectionStatus(ConnectionStatus.DISCONNECTED);
    logger.info(`WhatsApp disconnected for device ${this.deviceId}`);
  }

  async getChatParticipants(chatId: string): Promise<string[]> {
    if (!this.sock || !chatId.endsWith('@g.us')) {
      return [];
    }

    try {
      const groupMetadata = await this.sock.groupMetadata(chatId);
      return groupMetadata.participants.map(p => p.id);
    } catch (error) {
      logger.error('Failed to get chat participants', { deviceId: this.deviceId, chatId, error: error instanceof Error ? error.message : 'Unknown error' });
      return [];
    }
  }
}
