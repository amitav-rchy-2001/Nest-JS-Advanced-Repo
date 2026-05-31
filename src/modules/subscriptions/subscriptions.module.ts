import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../core/database/database.module';
import { StripeService } from '../../common/services/stripe.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeService],
})
export class SubscriptionsModule {}
