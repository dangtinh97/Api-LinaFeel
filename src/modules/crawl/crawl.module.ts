import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { HttpModule } from '@nestjs/axios';
import { CrawlController } from './crawl.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { News, NewsSchema } from './schemas/news.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: News.name,
        schema: NewsSchema,
      },
    ]),
    HttpModule,
  ],
  providers: [CrawlService],
  exports: [CrawlService],
  controllers: [CrawlController],
})
export class CrawlModule {}
