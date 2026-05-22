import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WebhookDispatchRequestedPayload } from '../events/app-event.types';
import { createHmac } from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createDelivery(payload: WebhookDispatchRequestedPayload) {
    return this.prisma.webhookDelivery.create({
      data: {
        url: payload.url,
        event: payload.event,
        payload: payload.payload as any,
        headers: payload.headers as any,
        status: 'PENDING',
      },
    });
  }

  async dispatch(deliveryId: string, payload: WebhookDispatchRequestedPayload) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(payload.headers ?? {}),
    };

    const body = JSON.stringify({
      event: payload.event,
      payload: payload.payload,
      sentAt: new Date().toISOString(),
    });

    if (payload.secret) {
      headers['x-webhook-signature'] = createHmac('sha256', payload.secret)
        .update(body)
        .digest('hex');
    }

    try {
      const response = await fetch(payload.url, {
        method: 'POST',
        headers,
        body,
      });

      const responseBody = await response.text();

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: response.ok ? 'SENT' : 'FAILED',
          responseStatusCode: response.status,
          responseBody: responseBody.slice(0, 2000),
          attempts: { increment: 1 },
          deliveredAt: response.ok ? new Date() : undefined,
          error: response.ok ? null : responseBody.slice(0, 1000),
        },
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      this.logger.log(`Webhook sent successfully: ${deliveryId}`);
    } catch (error) {
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }
}