import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
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
import { UpdateNannyProfileDto } from './dto/nanny.dto';
import { NannyService } from './nanny.service';

@ApiTags('Nanny')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nanny')
export class NannyController {
  constructor(private readonly nannyService: NannyService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get nanny profile' })
  @ApiResponse({ status: 200, description: 'Nanny profile' })
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.nannyService.profile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update nanny profile' })
  @ApiBody({ type: UpdateNannyProfileDto })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNannyProfileDto,
  ) {
    return this.nannyService.updateProfile(user.sub, dto);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List uploaded nanny documents' })
  documents(@CurrentUser() user: AuthenticatedUser) {
    return this.nannyService.documents(user.sub);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get account verification status' })
  status(@CurrentUser() user: AuthenticatedUser) {
    return this.nannyService.status(user.sub);
  }
}
