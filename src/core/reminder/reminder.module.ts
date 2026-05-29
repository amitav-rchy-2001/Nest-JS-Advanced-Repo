import { Global, Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { ReminderService } from './reminder.service';
import { ReminderProcessor } from './processors/reminder.processor';

@Global()
@Module({
  imports: [NotificationModule],
  providers: [ReminderService, ReminderProcessor],
  exports: [ReminderService],
})
export class ReminderModule {}
