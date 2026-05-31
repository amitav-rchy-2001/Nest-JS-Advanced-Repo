import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

const languages = ['en', 'si', 'hi', 'ar', 'fil'] as const;

export class UpdateNannyProfileDto {
  @ApiPropertyOptional({ example: 'Eva Turner' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ enum: languages })
  @IsOptional()
  @IsEnum(languages)
  preferredLanguage?: 'en' | 'si' | 'hi' | 'ar' | 'fil';
}
