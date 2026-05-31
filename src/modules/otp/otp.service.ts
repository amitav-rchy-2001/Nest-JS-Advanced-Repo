import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { TwilioVerifyService } from '../../common/services/twilio-verify.service';
import { SendOtpDto, VerifyOtpCodeDto } from './dto/otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioVerify: TwilioVerifyService,
  ) {}

  async send(dto: SendOtpDto) {
    const otpCode = String(randomInt(100000, 999999));
    await this.prisma.otpVerification.create({
      data: {
        phone: dto.phone,
        otpCode,
        otpType: 'phone_verification',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await this.twilioVerify.send(dto.phone);

    return { sent: true, devOtp: otpCode };
  }

  async verify(dto: VerifyOtpCodeDto) {
    const otp = await this.prisma.otpVerification.findFirst({
      where: {
        phone: dto.phone,
        otpCode: dto.otpCode,
        otpType: 'phone_verification',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return { verified: true };
  }
}
