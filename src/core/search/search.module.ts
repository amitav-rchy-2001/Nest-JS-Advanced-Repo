import { Global, Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchProcessor } from './processors/search.processor';

@Global()
@Module({
  providers: [SearchService, SearchProcessor],
  exports: [SearchService],
})
export class SearchModule {}
