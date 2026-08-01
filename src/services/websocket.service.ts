import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketMessage, EventType, AppEvent, ConnectionStatus } from '../types';
import { logger } from '../utils/logger';

/**
 * WebSocket Service for real-time communication
 */
export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private eventHandlers: Map<EventType, Array<(data: any) => void>> = new Map();
  private currentWhatsAppStatus: ConnectionStatus | null = null;
  private currentQR: string | null = null;
  private currentUser: any = null;
  private onSendMessageCallback?: (chatId: string, message: string) => Promise<boolean>;

  constructor(private port: number = 8080) {
    logger.info('WebSocket Service initialized', { port });
  }

  /**
   * Set callback for sending manual messages from HTTP API
   */
  setOnSendMessage(callback: (chatId: string, message: string) => Promise<boolean>): void {
    this.onSendMessageCallback = callback;
  }

  /**
   * Initialize WebSocket server and HTTP status API
   */
  initialize(): void {
    try {
      this.wss = new WebSocketServer({ port: this.port });
      
      this.wss.on('connection', (ws: WebSocket) => {
        this.handleConnection(ws);
      });

      this.wss.on('error', (error) => {
        logger.error('WebSocket server error', { error: error.message });
      });

      logger.info('WebSocket server started', { port: this.port });

      // Start HTTP API server on port+1
      this.startHttpServer(this.port + 1);
    } catch (error) {
      logger.error('Failed to initialize WebSocket server', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    logger.info('New WebSocket client connected', { 
      totalClients: this.clients.size 
    });

    // Send initial connection message
    this.sendToClient(ws, {
      type: 'connection',
      data: { status: 'connected', timestamp: Date.now() },
      timestamp: Date.now(),
    });

    // Send current WhatsApp status if known
    if (this.currentWhatsAppStatus) {
      logger.info('Sending cached WhatsApp status to new client', { status: this.currentWhatsAppStatus });
      this.sendToClient(ws, {
        type: 'message',
        data: {
          type: EventType.CONNECTION_STATUS_CHANGED,
          data: { status: this.currentWhatsAppStatus },
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
    }

    // Send current QR if known
    logger.info('Checking cached QR for new client', { hasQR: !!this.currentQR, qrLength: this.currentQR?.length ?? 0 });
    if (this.currentQR) {
      logger.info('Sending cached QR code to new client');
      this.sendToClient(ws, {
        type: 'message',
        data: {
          type: EventType.QR_CODE_GENERATED,
          data: { qr: this.currentQR },
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
    }

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleClientMessage(ws, message);
      } catch (error) {
        logger.error('Error parsing WebSocket message', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info('WebSocket client disconnected', { 
        totalClients: this.clients.size 
      });
    });

    ws.on('error', (error) => {
      logger.error('WebSocket client error', { 
        error: error.message 
      });
      this.clients.delete(ws);
    });
  }

  /**
   * Handle incoming client messages
   */
  private handleClientMessage(_ws: WebSocket, message: WebSocketMessage): void {
    logger.debug('Received WebSocket message', { 
      type: message.type, 
      data: message.data 
    });

    switch (message.type) {
      case 'message':
        this.broadcastMessage(message);
        break;
      case 'status':
        this.broadcastStatus(message.data);
        break;
      default:
        logger.warn('Unknown WebSocket message type', { type: message.type });
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Error sending message to client', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastMessage(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          logger.error('Error broadcasting message to client', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    }
  }

  /**
   * Broadcast status update
   */
  broadcastStatus(status: any): void {
    const message: WebSocketMessage = {
      type: 'status',
      data: status,
      timestamp: Date.now(),
    };
    
    this.broadcastMessage(message);
  }

  /**
   * Broadcast application event
   */
  broadcastEvent(event: AppEvent): void {
    const message: WebSocketMessage = {
      type: 'message',
      data: event,
      timestamp: Date.now(),
    };
    
    this.broadcastMessage(message);
  }

  /**
   * Add event handler
   */
  onEvent(eventType: EventType, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Emit event to all handlers
   */
  emitEvent(event: AppEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event.data);
        } catch (error) {
          logger.error('Error in event handler', { 
            eventType: event.type, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      });
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get server status
   */
  getServerStatus(): {
    isRunning: boolean;
    port: number;
    connectedClients: number;
  } {
    return {
      isRunning: this.wss !== null,
      port: this.port,
      connectedClients: this.clients.size,
    };
  }

  /**
   * Start HTTP server for status API
   */
  private startHttpServer(httpPort: number): void {
    const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-internal-auth');
      res.setHeader('Content-Type', 'application/json');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url === '/api/status' && req.method === 'GET') {
        const response = {
          status: this.currentWhatsAppStatus || 'disconnected',
          qr: this.currentQR,
          connectedClients: this.clients.size,
          timestamp: Date.now(),
          user: this.currentUser,
        };
        res.writeHead(200);
        res.end(JSON.stringify(response));
        return;
      }

      if (req.url === '/api/send' && req.method === 'POST') {
        if (req.headers['x-internal-auth'] !== 'true') {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { chatId, message } = JSON.parse(body);
            if (!chatId || !message) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'Missing chatId or message' }));
              return;
            }
            if (this.onSendMessageCallback) {
              const success = await this.onSendMessageCallback(chatId, message);
              res.writeHead(success ? 200 : 500);
              res.end(JSON.stringify({ success }));
            } else {
              res.writeHead(500);
              res.end(JSON.stringify({ error: 'Callback not set' }));
            }
          } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    httpServer.listen(httpPort, '0.0.0.0', () => {
      logger.info('HTTP status API started', { port: httpPort });
    });
  }

  /**
   * Close WebSocket server
   */
  close(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      this.clients.clear();
      logger.info('WebSocket server closed');
    }
  }

  /**
   * Send connection status update
   */
  sendConnectionStatus(status: ConnectionStatus, user: any = null): void {
    this.currentWhatsAppStatus = status;
    if (user) {
      this.currentUser = user;
    }
    if (status === ConnectionStatus.DISCONNECTED) {
      this.currentUser = null;
    }
    if (status === ConnectionStatus.CONNECTED || status === ConnectionStatus.READY) {
      this.currentQR = null; // Clear QR when connected
    }
    this.broadcastEvent({
      type: EventType.CONNECTION_STATUS_CHANGED,
      data: { status },
      timestamp: Date.now(),
    });
  }

  /**
   * Send QR code generated event
   */
  sendQRGenerated(qr: string): void {
    this.currentQR = qr;
    this.broadcastEvent({
      type: EventType.QR_CODE_GENERATED,
      data: { qr },
      timestamp: Date.now(),
    });
  }

  /**
   * Send message received event
   */
  sendMessageReceived(message: any): void {
    this.broadcastEvent({
      type: EventType.MESSAGE_RECEIVED,
      data: message,
      timestamp: Date.now(),
    });
  }

  /**
   * Send message sent event
   */
  sendMessageSent(message: any): void {
    this.broadcastEvent({
      type: EventType.MESSAGE_SENT,
      data: message,
      timestamp: Date.now(),
    });
  }

  /**
   * Send AI response generated event
   */
  sendAIResponseGenerated(response: any): void {
    this.broadcastEvent({
      type: EventType.AI_RESPONSE_GENERATED,
      data: response,
      timestamp: Date.now(),
    });
  }

  /**
   * Send error event
   */
  sendError(error: any): void {
    this.broadcastEvent({
      type: EventType.ERROR_OCCURRED,
      data: error,
      timestamp: Date.now(),
    });
  }
} 