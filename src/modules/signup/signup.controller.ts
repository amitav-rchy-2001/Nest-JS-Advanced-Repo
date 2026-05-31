import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  LanguageSelectionDto,
  NannyContactDto,
  ParentProfileDto,
  ParentSubscribeDto,
  ResendOtpDto,
  SignupGoogleDto,
  SignupInitDto,
  UploadDocumentDto,
  VerifyOtpDto,
} from './dto/signup.dto';
import { SignupService } from './signup.service';

@ApiTags('Signup')
@Controller('signup')
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post('init')
  @ApiOperation({ summary: 'Step 1: Full name, email, password, and role' })
  @ApiBody({ type: SignupInitDto })
  @ApiResponse({ status: 201, description: 'Temporary signup JWT issued' })
  init(@Body() dto: SignupInitDto) {
    return this.signupService.init(dto);
  }

  @Post('google')
  @ApiOperation({ summary: 'Step 1 alternative: Google OAuth signup init' })
  @ApiBody({ type: SignupGoogleDto })
  @ApiResponse({ status: 201, description: 'Temporary signup JWT issued' })
  google(@Body() dto: SignupGoogleDto) {
    return this.signupService.google(dto);
  }

  @Post('nanny/contact')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Step 2 nanny: phone and preferred language' })
  @ApiBody({ type: NannyContactDto })
  nannyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: NannyContactDto,
  ) {
    return this.signupService.nannyContact(user.sub, dto);
  }

  @Post('verify-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Step 3 nanny: verify phone OTP' })
  @ApiBody({ type: VerifyOtpDto })
  verifyOtp(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyOtpDto) {
    return this.signupService.verifyOtp(user.sub, dto);
  }

  @Post('resend-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend phone OTP' })
  @ApiBody({ type: ResendOtpDto })
  resendOtp(@CurrentUser() user: AuthenticatedUser, @Body() dto: ResendOtpDto) {
    return this.signupService.resendOtp(user.sub, dto.phone);
  }

  @Post('languages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Step 4 nanny or parent: language selection' })
  @ApiBody({ type: LanguageSelectionDto })
  languages(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LanguageSelectionDto,
  ) {
    return this.signupService.languages(user.sub, dto);
  }

  @Post('documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload passport or NID document' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['documentType', 'file'],
      properties: {
        documentType: { type: 'string', enum: ['passport', 'nid'] },
        documentSide: { type: 'string', enum: ['front', 'back', 'single'] },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  documents(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.signupService.documents(user.sub, dto, file);
  }

  @Post('nanny/face')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Step 6 nanny: upload face capture image' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  nannyFace(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.signupService.nannyFace(user.sub, file);
  }

  @Post('parent/profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Step 2 parent: profile image, address, and phone' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string' },
        addressLine1: { type: 'string' },
        street: { type: 'string' },
        postalCode: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  parentProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ParentProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.signupService.parentProfile(user.sub, dto, file);
  }

  @Post('parent/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Step 5 parent: select plan and create payment' })
  @ApiBody({ type: ParentSubscribeDto })
  parentSubscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ParentSubscribeDto,
  ) {
    return this.signupService.parentSubscribe(user.sub, dto);
  }

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current signup step' })
  progress(@CurrentUser() user: AuthenticatedUser) {
    return this.signupService.progress(user.sub);
  }
}
