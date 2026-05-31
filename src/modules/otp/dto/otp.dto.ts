import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '+15551234567' })
  @IsPhoneNumber()
  phone: string;
}

export class VerifyOtpCodeDto extends SendOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  otpCode: string;
}
