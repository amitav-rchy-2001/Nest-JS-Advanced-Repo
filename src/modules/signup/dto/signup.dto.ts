import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const roles = ['nanny', 'parent'] as const;
const languages = ['en', 'si', 'hi', 'ar', 'fil'] as const;
const documentTypes = ['passport', 'nid'] as const;
const documentSides = ['front', 'back', 'single'] as const;

export class SignupInitDto {
  @ApiProperty({ example: 'Eva Turner' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'eva@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3cretpass!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: roles })
  @IsEnum(roles)
  role: 'nanny' | 'parent';
}

export class SignupGoogleDto {
  @ApiProperty({ example: 'google-oauth-id-token' })
  @IsString()
  idToken: string;

  @ApiProperty({ enum: roles })
  @IsEnum(roles)
  role: 'nanny' | 'parent';
}

export class NannyContactDto {
  @ApiProperty({ example: '+15551234567' })
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional({ enum: languages })
  @IsOptional()
  @IsEnum(languages)
  preferredLanguage?: 'en' | 'si' | 'hi' | 'ar' | 'fil';
}

export class VerifyOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  otpCode: string;
}

export class ResendOtpDto {
  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

export class LanguageSelectionItemDto {
  @ApiProperty({ enum: languages })
  @IsEnum(languages)
  language: 'en' | 'si' | 'hi' | 'ar' | 'fil';

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class LanguageSelectionDto {
  @ApiProperty({ type: [LanguageSelectionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageSelectionItemDto)
  languages: LanguageSelectionItemDto[];
}

export class UploadDocumentDto {
  @ApiProperty({ enum: documentTypes })
  @IsEnum(documentTypes)
  documentType: 'passport' | 'nid';

  @ApiPropertyOptional({ enum: documentSides })
  @IsOptional()
  @IsEnum(documentSides)
  documentSide?: 'front' | 'back' | 'single';
}

export class ParentProfileDto {
  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ example: '12 Market Street' })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Market Street' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: '94103' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class ParentSubscribeDto {
  @ApiProperty({ example: 'plan_uuid' })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
