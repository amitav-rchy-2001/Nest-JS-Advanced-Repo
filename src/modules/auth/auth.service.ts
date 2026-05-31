import {
  BadRequestException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { MailService } from '../../core/mail/mail.service';
import {
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  ResetPasswordDto,
  VerifyResetOtpDto,
} from './dto/auth.dto';

type TokenPayload = {
  sub: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  sessionId?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  async login(
    dto: LoginDto,
    requestMeta: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSession(user, requestMeta);
  }

  async google(
    dto: GoogleAuthDto,
    requestMeta: { ipAddress?: string; userAgent?: string },
  ) {
    const googleUser = await this.getGoogleProfile(dto.idToken);
    const role = dto.role ?? 'parent';
    const user = await this.prisma.user.upsert({
      where: { googleId: googleUser.googleId },
      update: {
        email: googleUser.email,
        fullName: googleUser.fullName,
        isEmailVerified: true,
      },
      create: {
        googleId: googleUser.googleId,
        email: googleUser.email,
        fullName: googleUser.fullName,
        role,
        isEmailVerified: true,
      },
    });

    await this.ensureRoleProfile(user.id, user.role);

    return this.createSession(user, requestMeta);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Refresh session is invalid');
    }

    const isValid = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Refresh session is invalid');
    }

    const accessToken = await this.signAccessToken({
      sub: session.user.id,
      email: session.user.email,
      phone: session.user.phone,
      role: session.user.role,
      sessionId: session.id,
    });

    return { accessToken };
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    await this.prisma.authSession.updateMany({
      where: { id: payload.sessionId, userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { revoked: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (!user) {
      return {
        message: 'If the account exists, reset instructions were sent.',
      };
    }

    if (dto.phone) {
      const otpCode = String(randomInt(100000, 999999));
      await this.prisma.otpVerification.create({
        data: {
          userId: user.id,
          phone: dto.phone,
          otpCode,
          otpType: 'password_reset_phone',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      return {
        message: 'Password reset OTP sent.',
        delivery: 'phone',
        devOtp: otpCode,
      };
    }

    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        resetVia: 'email',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    if (this.configService.get<string>('SMTP_HOST') && user.email) {
      await this.mailService?.send({
        to: user.email,
        subject: 'Reset your NannyApp password',
        text: `Use this password reset token: ${token}`,
      });
    }

    return {
      message: 'Password reset email sent.',
      delivery: 'email',
      devToken: token,
    };
  }

  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const otp = await this.prisma.otpVerification.findFirst({
      where: {
        phone: dto.phone,
        otpCode: dto.otpCode,
        otpType: 'password_reset_phone',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    return { verified: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const passwordHash = await bcrypt.hash(
      dto.newPassword,
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12),
    );

    if (dto.token) {
      const resetToken = await this.prisma.passwordResetToken.findFirst({
        where: {
          token: dto.token,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!resetToken) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash },
        }),
        this.prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { isUsed: true },
        }),
      ]);

      return { reset: true };
    }

    if (dto.phone && dto.otpCode) {
      const otp = await this.prisma.otpVerification.findFirst({
        where: {
          phone: dto.phone,
          otpCode: dto.otpCode,
          otpType: 'password_reset_phone',
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!otp?.userId) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: otp.userId },
          data: { passwordHash },
        }),
        this.prisma.otpVerification.update({
          where: { id: otp.id },
          data: { isUsed: true },
        }),
      ]);

      return { reset: true };
    }

    throw new BadRequestException('Provide a reset token or phone OTP');
  }

  async createTempToken(userId: string) {
    return this.jwtService.signAsync(
      { sub: userId, purpose: 'signup' },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '2h',
      },
    );
  }

  async createSession(
    user: {
      id: string;
      email?: string | null;
      phone?: string | null;
      role: string;
    },
    requestMeta: { ipAddress?: string; userAgent?: string },
  ) {
    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: 'pending',
        deviceInfo: requestMeta.userAgent
          ? { userAgent: requestMeta.userAgent }
          : undefined,
        ipAddress: requestMeta.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      sessionId: session.id,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  private signAccessToken(payload: TokenPayload) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    } as never);
  }

  private signRefreshToken(payload: TokenPayload) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    } as never);
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async getGoogleProfile(idToken: string) {
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

    return {
      googleId: idToken,
      email: undefined,
      fullName: 'Google User',
    };
  }

  private async ensureRoleProfile(userId: string, role: string) {
    if (role === 'nanny') {
      await this.prisma.nannyProfile.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
    }

    if (role === 'parent') {
      await this.prisma.parentProfile.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
    }
  }
}
