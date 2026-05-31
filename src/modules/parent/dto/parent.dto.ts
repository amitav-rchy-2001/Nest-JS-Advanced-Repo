import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
} from 'class-validator';

const childAgeRanges = [
  'new_infant',
  'early_infant',
  'growing_infant',
  'infant',
  'young_toddler',
  'toddler',
  'early_childhood',
  'school_age_6_plus',
] as const;

const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateParentProfileDto {
  @ApiPropertyOptional({ example: 'Eva Turner' })
  @IsOptional()
  @IsString()
  fullName?: string;

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

export class CreateChildDto {
  @ApiProperty({
    example: 'Maya',
    description: "Child's name",
  })
  @IsString()
  name: string;

  @ApiProperty({
    enum: childAgeRanges,
    example: 'young_toddler',
    description:
      'Age range: new_infant (0-3 Months), early_infant (3-6 Months), growing_infant (6-9 Months), infant (9-12 Months), young_toddler (1-2 Years), toddler (2-4 Years), early_childhood (4-6 Years), school_age_6_plus (School Age 6+)',
  })
  @IsEnum(childAgeRanges)
  ageRange: (typeof childAgeRanges)[number];

  @ApiPropertyOptional({
    enum: weekdays,
    isArray: true,
    example: ['monday', 'wednesday', 'friday'],
    description: 'Optional educational schedule days, Monday through Friday',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(weekdays, { each: true })
  educationalDays?: (typeof weekdays)[number][];

  @ApiPropertyOptional({ example: '09:00', description: 'HH:mm local time' })
  @IsOptional()
  @Matches(timePattern)
  educationalStartTime?: string;

  @ApiPropertyOptional({ example: '12:30', description: 'HH:mm local time' })
  @IsOptional()
  @Matches(timePattern)
  educationalEndTime?: string;

  @ApiPropertyOptional({ example: '07:00', description: 'HH:mm local time' })
  @IsOptional()
  @Matches(timePattern)
  wakeupTime?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'HH:mm local time' })
  @IsOptional()
  @Matches(timePattern)
  napWindowFrom?: string;

  @ApiPropertyOptional({ example: '15:00', description: 'HH:mm local time' })
  @IsOptional()
  @Matches(timePattern)
  napWindowTo?: string;

  @ApiPropertyOptional({ example: '19:30', description: 'HH:mm local time' })
  @IsOptional()
  @Matches(timePattern)
  bedtimeFrom?: string;

  @ApiPropertyOptional({ example: '20:30', description: 'HH:mm local time' })
  @IsOptional()
  @Matches(timePattern)
  bedtimeTo?: string;

  @ApiPropertyOptional({
    example: 'No peanuts. Screen time limited to 20 minutes.',
  })
  @IsOptional()
  @IsString()
  restrictions?: string;
}
