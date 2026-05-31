import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ example: 'plan_uuid' })
  @IsString()
  planId: string;
}
