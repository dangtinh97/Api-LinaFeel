import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MarketingContent,
  MarketingContentSchema,
} from './schemas/marketing-content.schema';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MarketingContent.name,
        schema: MarketingContentSchema,
      },
    ]),
    HttpModule,
    AppConfigModule,
  ],
  controllers: [MarketingController],
  providers: [MarketingService],
})
export class MarketingModule {}
