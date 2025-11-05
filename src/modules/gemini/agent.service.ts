import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AIAgent } from './schemas/agent.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CrawlService } from '../crawl/crawl.service';
import { MoneyJournalService } from '../money-journal/money-journal.service';
import { AppConfigService } from '../app-config/app-config.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AgentService {
  constructor(
    @InjectModel(AIAgent.name)
    private readonly agentModel: Model<AIAgent>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly crawlService: CrawlService,
    private readonly moneyJournalService: MoneyJournalService,
    private readonly appConfigService: AppConfigService,
    private readonly userService: UserService,
  ) {}

  async analyzeContent({ key, contents }) {
    const promptAgents = await this.agentModel.find({
      active: true,
    });
    if (promptAgents.length == 0) {
      return null;
    }
    let users = contents.filter((item) => item.role == 'user');
    if (users.length == 0) {
      return null;
    }
    const lower = (users[users.length - 1].text ?? '').trim();
    if (lower == '') {
      return null;
    }
    // let objectNoun = promptAgents.object.length == 0;
    // let actionVerb = promptAgents.action_verb.length == 0;
    let functionAgent: any = {};
    for (const item of promptAgents) {
      const objectNoun =
        item.object_noun.length == 0 ||
        item.object_noun.some((word: string) => lower.includes(word));
      const actionVerb =
        item.action_verb.length == 0 ||
        item.action_verb.some((word: string) => lower.includes(word));
      if (objectNoun && actionVerb) {
        functionAgent = item;
        break;
      }
    }
    console.log(functionAgent);
  }
}
