import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { CloudinaryStorageService } from '../../common/services/cloudinary-storage.service';
import { TwilioVerifyService } from '../../common/services/twilio-verify.service';
import { AuthService } from '../auth/auth.service';
import {
  LanguageSelectionDto,
  NannyContactDto,
  ParentProfileDto,
  ParentSubscribeDto,
  SignupGoogleDto,
  SignupInitDto,
  UploadDocumentDto,
  VerifyOtpDto,
} from './dto/signup.dto';
import { StripeService } from '../../common/services/stripe.service';

@Injectable()
export class SignupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly cloudinaryStorage: CloudinaryStorageService,
    private readonly twilioVerify: TwilioVerifyService,
    private readonly stripe: StripeService,
  ) {}

  async init(dto: SignupInitDto) {
    const passwordHash = await bcrypt.hash(
      dto.password,
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12),
    );
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        fullName: dto.fullName,
        signupProgress: {
          create: {
            currentStep: 2,
            completedSteps: [1],
          },
        },
        nannyProfile: dto.role === 'nanny' ? { create: {} } : undefined,
        parentProfile: dto.role === 'parent' ? { create: {} } : undefined,
      },
    });

    return {
      userId: user.id,
      role: user.role,
      tempToken: await this.authService.createTempToken(user.id),
      currentStep: 2,
    };
  }

  async google(dto: SignupGoogleDto) {
    const googleProfile = this.decodeGoogleProfile(dto.idToken);
    const user = await this.prisma.user.upsert({
      where: { googleId: googleProfile.googleId },
      update: {
        email: googleProfile.email,
        fullName: googleProfile.fullName,
        isEmailVerified: true,
      },
      create: {
        googleId: googleProfile.googleId,
        email: googleProfile.email,
        fullName: googleProfile.fullName,
        role: dto.role,
        isEmailVerified: true,
        signupProgress: {
          create: { currentStep: 2, completedSteps: [1] },
        },
        nannyProfile: dto.role === 'nanny' ? { create: {} } : undefined,
        parentProfile: dto.role === 'parent' ? { create: {} } : undefined,
      },
    });

    return {
      userId: user.id,
      role: user.role,
      tempToken: await this.authService.createTempToken(user.id),
      currentStep: 2,
    };
  }

  async nannyContact(userId: string, dto: NannyContactDto) {
    const user = await this.requireRole(userId, 'nanny');
    const otpCode = String(randomInt(100000, 999999));

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { phone: dto.phone },
      }),
      this.prisma.nannyProfile.upsert({
        where: { userId },
        update: { preferredLanguage: dto.preferredLanguage },
        create: { userId, preferredLanguage: dto.preferredLanguage },
      }),
      this.prisma.otpVerification.create({
        data: {
          userId,
          phone: dto.phone,
          otpCode,
          otpType: 'phone_verification',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      }),
    ]);
    await this.twilioVerify.send(dto.phone);
    await this.setProgress(userId, 3, [1, 2]);

    return { currentStep: 3, devOtp: otpCode };
  }

  async verifyOtp(userId: string, dto: VerifyOtpDto) {
    const otp = await this.prisma.otpVerification.findFirst({
      where: {
        userId,
        otpCode: dto.otpCode,
        otpType: 'phone_verification',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.$transaction([
      this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { isUsed: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { isPhoneVerified: true },
      }),
    ]);
    await this.setProgress(userId, 4, [1, 2, 3]);

    return { verified: true, currentStep: 4 };
  }

  async resendOtp(userId: string, phone?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const destination = phone ?? user.phone;

    if (!destination) {
      throw new BadRequestException('Phone number is required');
    }

    const otpCode = String(randomInt(100000, 999999));
    await this.prisma.otpVerification.create({
      data: {
        userId,
        phone: destination,
        otpCode,
        otpType: 'phone_verification',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await this.twilioVerify.send(destination);

    return { resent: true, devOtp: otpCode };
  }

  async languages(userId: string, dto: LanguageSelectionDto) {
    await this.prisma.$transaction([
      this.prisma.userLanguage.deleteMany({ where: { userId } }),
      this.prisma.userLanguage.createMany({
        data: dto.languages.map((language) => ({ userId, ...language })),
        skipDuplicates: true,
      }),
    ]);
    await this.setProgress(userId, 5, [1, 2, 3, 4]);

    return { saved: true, currentStep: 5 };
  }

  async documents(
    userId: string,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    const uploaded = await this.cloudinaryStorage.upload(
      file,
      `nannyapp/users/${userId}/documents`,
    );
    const document = await this.prisma.identityDocument.create({
      data: {
        userId,
        documentType: dto.documentType,
        documentSide: dto.documentSide,
        ...uploaded,
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    await this.setProgress(
      userId,
      user.role === 'parent' ? 4 : 6,
      [1, 2, 3, 4, 5],
    );

    return document;
  }

  async nannyFace(userId: string, file: Express.Multer.File) {
    await this.requireRole(userId, 'nanny');

    if (!file) {
      throw new BadRequestException('Face capture image is required');
    }

    const uploaded = await this.cloudinaryStorage.upload(
      file,
      `nannyapp/users/${userId}/face`,
    );
    const profile = await this.prisma.nannyProfile.update({
      where: { userId },
      data: { faceImageUrl: uploaded.fileUrl },
    });
    await this.setProgress(userId, 7, [1, 2, 3, 4, 5, 6]);

    return profile;
  }

  async parentProfile(
    userId: string,
    dto: ParentProfileDto,
    file?: Express.Multer.File,
  ) {
    await this.requireRole(userId, 'parent');
    const uploaded = file
      ? await this.cloudinaryStorage.upload(
          file,
          `nannyapp/users/${userId}/profile`,
        )
      : undefined;

    const [user, profile] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      }),
      this.prisma.parentProfile.upsert({
        where: { userId },
        update: {
          profileImageUrl: uploaded?.fileUrl,
          addressLine1: dto.addressLine1,
          street: dto.street,
          postalCode: dto.postalCode,
          city: dto.city,
          state: dto.state,
        },
        create: {
          userId,
          profileImageUrl: uploaded?.fileUrl,
          addressLine1: dto.addressLine1,
          street: dto.street,
          postalCode: dto.postalCode,
          city: dto.city,
          state: dto.state,
        },
      }),
    ]);
    await this.setProgress(userId, 3, [1, 2]);

    return { user, profile, currentStep: 3 };
  }

  async parentSubscribe(userId: string, dto: ParentSubscribeDto) {
    await this.requireRole(userId, 'parent');
    const plan = await this.prisma.subscriptionPlan.findUniqueOrThrow({
      where: { id: dto.planId },
    });
    const subscription = await this.prisma.subscription.create({
      data: { userId, planId: plan.id },
    });
    const intent = await this.stripe.createPaymentIntent({
      amount: Math.round(Number(plan.priceAmount) * 100),
      currency: plan.currency,
      metadata: { userId, subscriptionId: subscription.id, planId: plan.id },
    });
    await this.setProgress(userId, 6, [1, 2, 3, 4, 5]);

    return { subscription, paymentIntent: intent };
  }

  progress(userId: string) {
    return this.prisma.signupProgress.findUnique({ where: { userId } });
  }

  private async setProgress(
    userId: string,
    currentStep: number,
    completedSteps: number[],
  ) {
    return this.prisma.signupProgress.upsert({
      where: { userId },
      update: { currentStep, completedSteps },
      create: { userId, currentStep, completedSteps },
    });
  }

  private async requireRole(userId: string, role: 'nanny' | 'parent') {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.role !== role) {
      throw new ForbiddenException(`Only ${role} users can complete this step`);
    }

    return user;
  }

  private decodeGoogleProfile(idToken: string) {
    const [, payload] = idToken.split('.');

    if (payload) {
      const decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { sub?: string; email?: string; name?: string };

      if (decoded.sub) {
        return {
          googleId: decoded.sub,
          email: decoded.email,
          fullName: decoded.name ?? decoded.email ?? 'Google User',
        };
      }
    }

    return { googleId: idToken, email: undefined, fullName: 'Google User' };
  }
}
