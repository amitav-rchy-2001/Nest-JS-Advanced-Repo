import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../core/database/database.module';
import { NannyController } from './nanny.controller';
import { NannyService } from './nanny.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [NannyController],
  providers: [NannyService],
})
export class NannyModule {}
