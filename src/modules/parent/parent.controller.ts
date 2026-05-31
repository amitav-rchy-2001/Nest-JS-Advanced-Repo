import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
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
import { ParentService } from './parent.service';
import { CreateChildDto, UpdateParentProfileDto } from './dto/parent.dto';

@ApiTags('Parent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parent')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get parent profile' })
  @ApiResponse({ status: 200, description: 'Parent profile' })
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.parentService.profile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update parent profile' })
  @ApiBody({ type: UpdateParentProfileDto })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateParentProfileDto,
  ) {
    return this.parentService.updateProfile(user.sub, dto);
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get current parent subscription' })
  subscription(@CurrentUser() user: AuthenticatedUser) {
    return this.parentService.subscription(user.sub);
  }

  @Post('children')
  @ApiOperation({ summary: 'Add a child to parent account' })
  @ApiBody({ type: CreateChildDto })
  @ApiResponse({ status: 201, description: 'Child profile created' })
  addChild(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateChildDto,
  ) {
    return this.parentService.addChild(user.sub, dto);
  }

  @Get('children')
  @ApiOperation({ summary: "Get parent's children" })
  @ApiResponse({ status: 200, description: 'List of child profiles' })
  children(@CurrentUser() user: AuthenticatedUser) {
    return this.parentService.children(user.sub);
  }
}
