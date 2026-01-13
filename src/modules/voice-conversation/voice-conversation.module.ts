import { Module } from '@nestjs/common';
import { VoiceConversationController } from './voice-conversation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VoiceConversation,
  VoiceConversationSchema,
} from './schemas/voice-conversation.schema';
import { VoiceConversationService } from './voice-conversation.service';
import { HttpModule } from '@nestjs/axios';
import { CrawlModule } from '../crawl/crawl.module';
import { LogModule } from '../log/log.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { UserModule } from '../user/user.module';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: VoiceConversation.name,
        schema: VoiceConversationSchema,
      }
    ]),
    HttpModule,
    CrawlModule,
    LogModule,
    AppConfigModule,
    UserModule,
    GeminiModule,
  ],
  controllers: [VoiceConversationController],
  providers: [VoiceConversationService],
})
export class VoiceConversationModule {}
