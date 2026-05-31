import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SendOtpDto, VerifyOtpCodeDto } from './dto/otp.dto';
import { OtpService } from './otp.service';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send OTP to phone via Twilio Verify' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 201, description: 'OTP sent' })
  send(@Body() dto: SendOtpDto) {
    return this.otpService.send(dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiBody({ type: VerifyOtpCodeDto })
  @ApiResponse({ status: 201, description: 'OTP verified' })
  verify(@Body() dto: VerifyOtpCodeDto) {
    return this.otpService.verify(dto);
  }
}
