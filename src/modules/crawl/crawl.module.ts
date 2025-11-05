import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { HttpModule } from '@nestjs/axios';
import { CrawlController } from './crawl.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { News, NewsSchema } from './schemas/news.schema';
import { Location, LocationSchema } from './schemas/location.schema';
import { AppConfigModule } from '../app-config/app-config.module';
import { Weather, WeatherSchema } from './schemas/weather.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: News.name,
        schema: NewsSchema,
      },
      {
        name: Location.name,
        schema: LocationSchema,
      },
      {
        name: Weather.name,
        schema: WeatherSchema,
      },
    ]),
    HttpModule,
    AppConfigModule,
  ],
  providers: [CrawlService],
  exports: [CrawlService],
  controllers: [CrawlController],
})
export class CrawlModule {}
