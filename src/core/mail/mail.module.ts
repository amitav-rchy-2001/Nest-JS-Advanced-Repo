import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailProcessor } from './processors/email.processor';

@Global()
@Module({
  providers: [MailService, EmailProcessor],
  exports: [MailService],
})
export class MailModule {}
