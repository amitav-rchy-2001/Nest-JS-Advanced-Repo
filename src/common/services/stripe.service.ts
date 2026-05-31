import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  constructor(private readonly configService: ConfigService) {}

  async createPaymentIntent(input: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }) {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secret) {
      return {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_secret_${Date.now()}`,
        status: 'requires_payment_method',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata ?? {},
      };
    }

    const body = new URLSearchParams({
      amount: String(input.amount),
      currency: input.currency.toLowerCase(),
    });

    Object.entries(input.metadata ?? {}).forEach(([key, value]) => {
      body.append(`metadata[${key}]`, value);
    });

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.json();
  }
}
