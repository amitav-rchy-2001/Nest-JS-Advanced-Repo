import { Global, Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookProcessor } from './processor/webhook.processor';

@Global()
@Module({
  providers: [WebhookService, WebhookProcessor],
  exports: [WebhookService],
})
export class WebhookModule {}