import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CheckoutDto } from './dto/subscriptions.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans' })
  @ApiResponse({ status: 200, description: 'Available plans' })
  plans() {
    return this.subscriptionsService.plans();
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  @ApiBody({ type: CheckoutDto })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.subscriptionsService.checkout(user.sub, dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiBody({ schema: { type: 'object', additionalProperties: true } })
  webhook(@Body() payload: Record<string, unknown>) {
    return this.subscriptionsService.webhook(payload);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's subscription" })
  my(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.my(user.sub);
  }

  @Delete('my/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current subscription' })
  cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.cancel(user.sub);
  }
}
