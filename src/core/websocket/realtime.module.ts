import { Global, Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { WebsocketProcessor } from './processors/websocket.processor';

@Global()
@Module({
  providers: [RealtimeGateway, RealtimeService, WebsocketProcessor],
  exports: [RealtimeService],
})
export class RealtimeModule {}