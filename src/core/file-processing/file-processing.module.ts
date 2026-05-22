import { Global, Module } from '@nestjs/common';
import { FileProcessingService } from './file-processing.service';
import { FileProcessingProcessor } from './processors/file-processing.processor';

@Global()
@Module({
  providers: [FileProcessingService, FileProcessingProcessor],
  exports: [FileProcessingService],
})
export class FileProcessingModule {}