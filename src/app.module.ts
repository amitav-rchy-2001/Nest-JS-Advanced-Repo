import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppEventModule } from './core/events/app-event.module';
import { DatabaseModule } from './core/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envValidationSchema.parse(config),
    }),

    DatabaseModule,
    AppEventModule,
    HealthModule,
  ],
})
export class AppModule {}