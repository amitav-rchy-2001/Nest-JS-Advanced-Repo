import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryStorageService } from '../../common/services/cloudinary-storage.service';
import { StripeService } from '../../common/services/stripe.service';
import { TwilioVerifyService } from '../../common/services/twilio-verify.service';
import { SignupController } from './signup.controller';
import { SignupService } from './signup.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SignupController],
  providers: [
    SignupService,
    CloudinaryStorageService,
    TwilioVerifyService,
    StripeService,
  ],
})
export class SignupModule {}
