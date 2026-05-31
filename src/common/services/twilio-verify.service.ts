import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwilioVerifyService {
  constructor(private readonly configService: ConfigService) {}

  async send(phone: string) {
    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const serviceSid = this.configService.get<string>(
      'TWILIO_VERIFY_SERVICE_SID',
    );

    if (!sid || !token || !serviceSid) {
      return { provider: 'local', status: 'pending', to: phone };
    }

    const body = new URLSearchParams({ To: phone, Channel: 'sms' });
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString(
            'base64',
          )}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    return response.json();
  }

  async verify(phone: string, code: string) {
    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const serviceSid = this.configService.get<string>(
      'TWILIO_VERIFY_SERVICE_SID',
    );

    if (!sid || !token || !serviceSid) {
      return { provider: 'local', status: 'approved', to: phone, code };
    }

    const body = new URLSearchParams({ To: phone, Code: code });
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString(
            'base64',
          )}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    return response.json();
  }
}
