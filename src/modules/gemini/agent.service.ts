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
import { getErrorMessage, getMessageFinance, NEWS } from '../../common/keyword';
import { lastValueFrom } from 'rxjs';
import * as _ from 'lodash';
import { ObjectId } from 'mongodb';
import { Weather } from '../crawl/schemas/weather.schema';

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

  async analyzeContent({ key, contents, user_oid }) {
    const promptAgents = await this.agentModel.find({
      active: true,
    });
    if (promptAgents.length == 0) {
      return null;
    }
    const users = contents.filter((item: any) => item.role == 'user');
    if (users.length == 0) {
      return null;
    }
    const lower = (users[users.length - 1].text ?? '').trim().toLowerCase();
    console.log(lower);
    if (lower == '') {
      return null;
    }
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
    if (functionAgent.key === 'gold_price') return this.priceGold();
    if (functionAgent.key === 'take_photo')
      return {
        status: 200,
        name: 'talk_photo',
        args: {
          intent: '',
        },
      };
    const curlAgent = await this.curlAgent({
      apiKey: key,
      text: lower,
      function_declarations: functionAgent.function_declarations,
    });
    if (curlAgent == null || curlAgent.status == 403) {
      return curlAgent;
    }
    if (curlAgent.args && curlAgent.name == 'open_music') {
      return { status: 200, ...curlAgent };
    }
    if (curlAgent.name === 'read_news') return await this.readNews(curlAgent);
    if (curlAgent.name === 'use_money') {
      return await this.saveMoney({
        callAgent: curlAgent,
        user_oid: user_oid,
      });
    }

    if (curlAgent.name == 'weather'){
      return await this.crawlService.crawlWeather(
        curlAgent.args.location ?? 'Hà Nội',
      );
    }

    return null;
  }

  private async saveMoney({ callAgent, user_oid }) {
    this.moneyJournalService
      .addJournal({
        ...callAgent.args,
        user_oid: new ObjectId(user_oid),
      })
      .then();
    return {
      status: 200,
      text: getMessageFinance(callAgent.args),
    };
  }

  private async readNews(callAgent: any) {
    const { category, title, description } =
      await this.crawlService.getRandomNews(callAgent.args.category ?? 'ALL');
    return {
      status: 200,
      text: `Tin ${category.toLowerCase()}: ${title}. ${description}`,
    };
  }

  private async priceGold() {
    const ansGold = await this.crawlService.goldPrice();
    if (!ansGold) {
      return null;
    }
    return {
      text: ansGold ?? 'Hiện tại chưa có thông tin giá vàng',
      status: 200,
    };
  }

  async curlAgent({ text, apiKey, function_declarations }) {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
            },
          ],
        },
      ],
      tools: [
        {
          functionDeclarations: [function_declarations],
        },
      ],
    };
    console.log(JSON.stringify(body, null, 2));
    try {
      const curl = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
          },
        }),
      );
      console.log(JSON.stringify(curl.data, null, 2));
      if (curl.status != 200) {
        return {
          status: 403,
          text: getErrorMessage(),
        };
      }
      return _.get(curl.data, 'candidates.0.content.parts.0.functionCall');
    } catch (e) {
      console.log(e);
      return {
        status: 403,
        text: getErrorMessage(),
      };
    }
  }
}
