import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server | undefined;

  constructor(private readonly realtimeService: RealtimeService) {}

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-user-room')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId: string },
  ) {
    this.realtimeService.joinUserRoom(client, body.userId);

    return {
      success: true,
      room: `user:${body.userId}`,
    };
  }

  @SubscribeMessage('join-conversation-room')
  handleJoinConversationRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    this.realtimeService.joinConversationRoom(client, body.conversationId);

    return {
      success: true,
      room: `conversation:${body.conversationId}`,
    };
  }
}