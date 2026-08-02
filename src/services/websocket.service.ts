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
  
  // Maps to support multiple devices
  private whatsappStatuses: Map<string, ConnectionStatus> = new Map();
  private qrs: Map<string, string> = new Map();
  private users: Map<string, any> = new Map();
  
  private onSendMessageCallback?: (deviceId: string, chatId: string, message: string) => Promise<boolean>;
  private onConnectCallback?: (deviceId: string) => Promise<boolean>;
  private onDisconnectCallback?: (deviceId: string) => Promise<boolean>;

  constructor(private port: number = 8080) {
    logger.info('WebSocket Service initialized', { port });
  }

  /**
   * Set callback for sending manual messages from HTTP API
   */
  setOnSendMessage(callback: (deviceId: string, chatId: string, message: string) => Promise<boolean>): void {
    this.onSendMessageCallback = callback;
  }

  /**
   * Set callback for triggering manual connection from HTTP API
   */
  setOnConnect(callback: (deviceId: string) => Promise<boolean>): void {
    this.onConnectCallback = callback;
  }

  /**
   * Set callback for triggering manual disconnection from HTTP API
   */
  setOnDisconnect(callback: (deviceId: string) => Promise<boolean>): void {
    this.onDisconnectCallback = callback;
  }

  /**
   * Initialize WebSocket server and HTTP status API
   */
  initialize(): void {
    try {
      this.wss = new WebSocketServer({ port: this.port });
      
      this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        // Authenticate WebSocket connection
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        const expectedSecret = process.env['INTERNAL_AUTH_SECRET'] || 'true';
        
        if (token !== expectedSecret) {
          logger.warn('Unauthorized WebSocket connection attempt rejected');
          ws.close(1008, 'Unauthorized');
          return;
        }

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
    logger.info('New authenticated WebSocket client connected', { 
      totalClients: this.clients.size 
    });

    // Send initial connection message
    this.sendToClient(ws, {
      type: 'connection',
      data: { status: 'connected', timestamp: Date.now() },
      timestamp: Date.now(),
    });

    // Send current WhatsApp statuses to new client
    this.whatsappStatuses.forEach((status, deviceId) => {
      this.sendToClient(ws, {
        type: 'message',
        data: {
          type: EventType.CONNECTION_STATUS_CHANGED,
          data: { deviceId, status },
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
    });

    // Send current QRs to new client
    this.qrs.forEach((qr, deviceId) => {
      this.sendToClient(ws, {
        type: 'message',
        data: {
          type: EventType.QR_CODE_GENERATED,
          data: { deviceId, qr },
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
    });

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

      const url = new URL(req.url || '/', `http://${req.headers.host}`);

      if (url.pathname === '/api/status' && req.method === 'GET') {
        const targetDeviceId: string | null = url.searchParams.get('deviceId');
        
        // Remove default-device fallback. If not provided, it's just disconnected.
        const response = {
          status: targetDeviceId ? (this.whatsappStatuses.get(targetDeviceId) || 'disconnected') : 'disconnected',
          qr: targetDeviceId ? (this.qrs.get(targetDeviceId) || null) : null,
          connectedClients: this.clients.size,
          timestamp: Date.now(),
          user: targetDeviceId ? (this.users.get(targetDeviceId) || null) : null,
          deviceId: targetDeviceId
        };
        res.writeHead(200);
        res.end(JSON.stringify(response));
        return;
      }

      if (url.pathname === '/api/send' && req.method === 'POST') {
        if (req.headers['x-internal-auth'] !== (process.env['INTERNAL_AUTH_SECRET'] || 'true')) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { deviceId, chatId, message } = JSON.parse(body);
            if (!chatId || !message) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'Missing chatId or message' }));
              return;
            }
            
            const targetDeviceId = deviceId;
            if (!targetDeviceId) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'Missing deviceId' }));
              return;
            }
            
            if (this.onSendMessageCallback) {
              const success = await this.onSendMessageCallback(targetDeviceId, chatId, message);
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

      if (url.pathname === '/api/connect' && req.method === 'POST') {
        if (req.headers['x-internal-auth'] !== (process.env['INTERNAL_AUTH_SECRET'] || 'true')) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { deviceId } = JSON.parse(body);
            if (!deviceId) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'Missing deviceId' }));
              return;
            }
            
            if (this.onConnectCallback) {
              const success = await this.onConnectCallback(deviceId);
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

      if (url.pathname === '/api/disconnect' && req.method === 'POST') {
        if (req.headers['x-internal-auth'] !== (process.env['INTERNAL_AUTH_SECRET'] || 'true')) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { deviceId } = JSON.parse(body);
            if (!deviceId) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'Missing deviceId' }));
              return;
            }
            
            if (this.onDisconnectCallback) {
              const success = await this.onDisconnectCallback(deviceId);
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
  sendConnectionStatus(deviceId: string, status: ConnectionStatus, user: any = null): void {
    this.whatsappStatuses.set(deviceId, status);
    if (user) {
      this.users.set(deviceId, user);
    }
    if (status === ConnectionStatus.DISCONNECTED) {
      this.users.delete(deviceId);
    }
    if (status === ConnectionStatus.CONNECTED || status === ConnectionStatus.READY) {
      this.qrs.delete(deviceId); // Clear QR when connected
    }
    this.broadcastEvent({
      type: EventType.CONNECTION_STATUS_CHANGED,
      data: { deviceId, status },
      timestamp: Date.now(),
    });
  }

  /**
   * Send QR code generated event
   */
  sendQRGenerated(deviceId: string, qr: string): void {
    this.qrs.set(deviceId, qr);
    this.broadcastEvent({
      type: EventType.QR_CODE_GENERATED,
      data: { deviceId, qr },
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