import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { StripeService } from '../../common/services/stripe.service';
import { CheckoutDto } from './dto/subscriptions.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  plans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const subscription = await this.prisma.subscription.create({
      data: { userId, planId: plan.id },
    });
    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: Math.round(Number(plan.priceAmount) * 100),
      currency: plan.currency,
      metadata: { userId, planId: plan.id, subscriptionId: subscription.id },
    });

    await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: plan.priceAmount,
        currency: plan.currency,
        paymentGateway: 'stripe',
        gatewayTransactionId: paymentIntent.id,
        gatewayPayload: paymentIntent,
      },
    });

    return { subscription, paymentIntent };
  }

  async webhook(payload: Record<string, unknown>) {
    const eventType = String(payload.type ?? '');
    const data = payload.data as
      | {
          object?: {
            id?: string;
            status?: string;
            metadata?: Record<string, string>;
          };
        }
      | undefined;
    const object = data?.object;

    if (eventType === 'payment_intent.succeeded' && object?.metadata) {
      await this.prisma.payment.updateMany({
        where: { gatewayTransactionId: object.id },
        data: {
          status: 'completed',
          paidAt: new Date(),
          gatewayPayload: payload as Prisma.InputJsonValue,
        },
      });
      await this.prisma.subscription.updateMany({
        where: { id: object.metadata.subscriptionId },
        data: { status: 'active', startedAt: new Date() },
      });
    }

    if (eventType === 'payment_intent.payment_failed' && object?.id) {
      await this.prisma.payment.updateMany({
        where: { gatewayTransactionId: object.id },
        data: {
          status: 'failed',
          gatewayPayload: payload as Prisma.InputJsonValue,
        },
      });
    }

    return { received: true };
  }

  my(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'pending'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', autoRenew: false },
    });
  }
}
