import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { HttpModule } from '@nestjs/axios';
import { GeminiController } from './gemini.controller';
import { CrawlModule } from '../crawl/crawl.module';
import { LogModule } from '../log/log.module';
import { MoneyJournalModule } from '../money-journal/money-journal.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentService } from './agent.service';
import { AIAgent, AIAgentSchema } from './schemas/agent.schema';

@Module({
  imports: [
    HttpModule,
    CrawlModule,
    LogModule,
    MoneyJournalModule,
    AppConfigModule,
    UserModule,
    MongooseModule.forFeature([
      {
        name: AIAgent.name,
        schema: AIAgentSchema,
      },
    ]),
  ],
  exports: [GeminiService],
  providers: [GeminiService, AgentService],
  controllers: [GeminiController],
})
export class GeminiModule {}
