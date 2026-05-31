import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: 'parent@example.com' })
  @ValidateIf((dto: LoginDto) => !dto.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  @ValidateIf((dto: LoginDto) => !dto.email)
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({ example: 'S3cretpass!' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class GoogleAuthDto {
  @ApiProperty({ example: 'google-oauth-id-token' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({ enum: ['nanny', 'parent'] })
  @IsOptional()
  @IsString()
  role?: 'nanny' | 'parent';
}

export class RefreshDto {
  @ApiProperty({ example: 'refresh-token' })
  @IsString()
  refreshToken: string;
}

export class LogoutDto extends RefreshDto {}

export class ForgotPasswordDto {
  @ApiPropertyOptional({ example: 'parent@example.com' })
  @ValidateIf((dto: ForgotPasswordDto) => !dto.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  @ValidateIf((dto: ForgotPasswordDto) => !dto.email)
  @IsPhoneNumber()
  phone?: string;
}

export class ResetPasswordDto {
  @ApiPropertyOptional({ example: 'reset-token-from-email' })
  @ValidateIf((dto: ResetPasswordDto) => !dto.phone)
  @IsString()
  token?: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  @ValidateIf((dto: ResetPasswordDto) => !dto.token)
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ example: '123456' })
  @ValidateIf((dto: ResetPasswordDto) => !!dto.phone)
  @IsString()
  otpCode?: string;

  @ApiProperty({ example: 'N3wSecretpass!' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class VerifyResetOtpDto {
  @ApiProperty({ example: '+15551234567' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otpCode: string;
}
