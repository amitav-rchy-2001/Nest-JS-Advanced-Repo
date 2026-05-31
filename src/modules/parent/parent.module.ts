import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../core/database/database.module';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [ParentController],
  providers: [ParentService],
})
export class ParentModule {}
