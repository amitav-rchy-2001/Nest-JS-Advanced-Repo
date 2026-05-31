import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { EmailSendRequestedPayload } from '../events/app-event.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  private createTransporter() {
    return nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async send(payload: EmailSendRequestedPayload) {
    const transporter = this.createTransporter();

    const from = this.configService.get<string>(
      'MAIL_FROM',
      'Backend Template <no-reply@example.com>',
    );

    const result = await transporter.sendMail({
      from,
      to: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html ?? this.renderTemplate(payload),
    });

    this.logger.log(`Email sent: ${result.messageId}`);

    return result;
  }

  private renderTemplate(
    payload: EmailSendRequestedPayload,
  ): string | undefined {
    if (!payload.template) {
      return payload.html;
    }

    if (payload.template === 'welcome') {
      return `
        <h2>Welcome ${payload.data?.name ?? ''}</h2>
        <p>Your account has been created successfully.</p>
      `;
    }

    if (payload.template === 'notification') {
      return `
        <h2>${payload.data?.title ?? payload.subject}</h2>
        <p>${payload.data?.message ?? ''}</p>
      `;
    }

    return payload.html;
  }
}
