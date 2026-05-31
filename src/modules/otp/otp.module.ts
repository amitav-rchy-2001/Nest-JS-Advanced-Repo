import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { TwilioVerifyService } from '../../common/services/twilio-verify.service';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OtpController],
  providers: [OtpService, TwilioVerifyService],
})
export class OtpModule {}
