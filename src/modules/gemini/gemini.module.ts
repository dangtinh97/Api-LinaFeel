import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { HttpModule } from '@nestjs/axios';
import { GeminiController } from './gemini.controller';
import { CrawlModule } from '../crawl/crawl.module';
import { LogModule } from '../log/log.module';
import { MoneyJournalModule } from '../money-journal/money-journal.module';

@Module({
  imports: [HttpModule, CrawlModule, LogModule,MoneyJournalModule],
  exports: [GeminiService],
  providers: [GeminiService],
  controllers: [GeminiController],
})
export class GeminiModule {}
