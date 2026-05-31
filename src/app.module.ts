import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppEventModule } from './core/events/app-event.module';
import { DatabaseModule } from './core/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { SignupModule } from './modules/signup/signup.module';
import { OtpModule } from './modules/otp/otp.module';
import { NannyModule } from './modules/nanny/nanny.module';
import { ParentModule } from './modules/parent/parent.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envValidationSchema.parse(config),
    }),

    DatabaseModule,
    AppEventModule,
    HealthModule,
    AuthModule,
    SignupModule,
    OtpModule,
    NannyModule,
    ParentModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
