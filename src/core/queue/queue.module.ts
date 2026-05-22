import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '../events/app-event.constants';
import { QueueDispatchService } from './queue-dispatch.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),

    BullModule.registerQueue(
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.WEBSOCKET },
      { name: QUEUE_NAMES.WEBHOOK },
      { name: QUEUE_NAMES.FILE_PROCESSING },
      { name: QUEUE_NAMES.SEARCH },
      { name: QUEUE_NAMES.REMINDER },
    ),
  ],
  providers: [QueueDispatchService],
  exports: [QueueDispatchService, BullModule],
})
export class QueueModule {}