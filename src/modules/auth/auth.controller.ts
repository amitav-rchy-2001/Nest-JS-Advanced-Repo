import { Body, Controller, Ip, Post, Req } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  LogoutDto,
  RefreshDto,
  ResetPasswordDto,
  VerifyResetOtpDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login by email or phone and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'JWT access and refresh tokens' })
  login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.authService.login(dto, {
      ipAddress,
      userAgent: request.headers['user-agent'],
    });
  }

  @Post('google')
  @ApiOperation({ summary: 'Login or register with Google OAuth 2.0' })
  @ApiBody({ type: GoogleAuthDto })
  @ApiResponse({ status: 201, description: 'JWT access and refresh tokens' })
  google(
    @Body() dto: GoogleAuthDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.authService.google(dto, {
      ipAddress,
      userAgent: request.headers['user-agent'],
    });
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 201, description: 'New JWT access token' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke refresh token' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 201, description: 'Refresh session revoked' })
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset by email or phone' })
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with email token or phone OTP' })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-reset-otp')
  @ApiOperation({ summary: 'Verify OTP for phone-based password reset' })
  @ApiBody({ type: VerifyResetOtpDto })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }
}
