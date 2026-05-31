import { Global, Module } from '@nestjs/common';
import { SystemAlertService } from './system-alert.service';

@Global()
@Module({
  providers: [SystemAlertService],
  exports: [SystemAlertService],
})
export class SystemAlertModule {}
