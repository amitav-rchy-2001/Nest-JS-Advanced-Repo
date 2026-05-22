import { Global, Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { ReminderProcessor } from './processors/reminder.processor';

@Global()
@Module({
  providers: [ReminderService, ReminderProcessor],
  exports: [ReminderService],
})
export class ReminderModule {}