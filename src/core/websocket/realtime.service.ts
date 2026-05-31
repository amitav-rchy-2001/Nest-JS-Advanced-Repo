import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  joinUserRoom(client: Socket, userId: string) {
    const room = `user:${userId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
  }

  joinConversationRoom(client: Socket, conversationId: string) {
    const room = `conversation:${conversationId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
  }

  emitToRoom(room: string, event: string, data: Record<string, unknown>) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized yet');
      return;
    }

    this.server.to(room).emit(event, data);
    this.logger.log(`Emitted ${event} to ${room}`);
  }
}
