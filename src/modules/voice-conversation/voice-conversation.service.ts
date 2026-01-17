import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { VoiceConversation } from './schemas/voice-conversation.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CrawlService } from '../crawl/crawl.service';
import { AppConfigService } from '../app-config/app-config.service';
import { UserService } from '../user/user.service';
import { AgentService } from '../gemini/agent.service';
import { GeminiService } from '../gemini/gemini.service';
import { AppSettingKey } from '../app-config/schemas/app-setting.schema';
import * as dayjs from 'dayjs';
import * as _ from 'lodash';
import { getErrorMessage } from '../../common/keyword';

@Injectable()
export class VoiceConversationService {
  constructor(
    @InjectModel(VoiceConversation.name)
    private voiceConversationModel: Model<VoiceConversation>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly crawlService: CrawlService,
    private readonly appConfigService: AppConfigService,
    private readonly userService: UserService,
    private readonly aiAgentService: AgentService,
    private readonly geminiService: GeminiService,
  ) {}

  async smartConversation({
    user_oid,
    session_id,
    message,
    name,
    personality,
  }: any) {
    if (!session_id) {
      return {};
    }
    const user = await this.userService.infoUser(user_oid);
    let findConversation = await this.voiceConversationModel.aggregate([
      {
        $match: {
          user_oid: new ObjectId(user_oid),
          session_id: session_id,
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $limit: 50,
      },
    ]);
    findConversation = findConversation.reverse();
    if (
      findConversation.length > 6 &&
      (user.order_id ?? '').indexOf('GPA') === -1
    ) {
      return {
        name: 'BUY_LIFETIME',
        args: {
          content: this.geminiService.getRandomSupportMessage(),
        },
      };
    }
    let keyType = AppSettingKey.GEMINI_KEY_API;
    if (user && (user.order_id ?? '').indexOf('GPA') !== -1) {
      keyType = AppSettingKey.GEMINI_KEY_API_VIP;
    }
    const [agents, createConversation, apiKey, systemInstruction] =
      await Promise.all([
        this.aiAgentService.allAgent(),
        this.voiceConversationModel.create({
          user_oid: new ObjectId(user_oid),
          content: message,
          role: 'user',
          session_id: session_id,
          type: 'text',
        }),
        this.geminiService.getKey(keyType),
        this.appConfigService.getByKeyConfig('EMO_SYSTEM_INSTRUCTION'),
      ]);
    findConversation.push({
      type: 'text',
      role: 'user',
      content: message,
    });

    const contents = findConversation.map((item) => {
      const mappingItem: any = {
        role: item.role,
      };
      if (item.type == 'text') {
        mappingItem['parts'] = {
          text: item.content,
        };
      }
      if (item.type == 'function_call') {
        mappingItem['parts'] = [
          {
            functionCall: item.content,
          },
        ];
      }

      if (item.type == 'function') {
        mappingItem['parts'] = [
          {
            functionResponse: item.content,
          },
        ];
      }

      return mappingItem;
    });
    const time = dayjs(new Date())
      .add(7, 'hours')
      .format('dddd, HH:mm DD/MM/YYYY')
      .toString();

    personality =
      personality.trim() == ''
        ? ''
        : `Bạn có tính cách ${personality.trim()}.`;
    name = name.trim() == '' ? '' : `Tên của tôi là ${name.trim()}.`;

    const prompt = systemInstruction['vi']
      .replaceAll('{{user_name}}', name)
      .replaceAll('{{time}}', time)
      .replaceAll('{{personality}}', personality)
      .replace(/\s+/g, ' ')
      .trim();
    const body = {
      system_instruction: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      tools: {
        functionDeclarations: agents.tools,
      },
      contents,
    };
    const response = await this.geminiService.curl(body, apiKey);
    if (response == null) {
      await this.voiceConversationModel.deleteOne({
        _id: new ObjectId(createConversation._id.toString()),
      });
      await this.voiceConversationModel.deleteMany({
        session_id: session_id,
      });
      return {
        text: getErrorMessage(),
      };
    }
    if (response.text) {
      const contentNew = (response.text ?? '')
        .replaceAll('*', '')
        .replaceAll('\n', '');
      await this.voiceConversationModel.create({
        user_oid: new ObjectId(user_oid),
        session_id: session_id,
        content: contentNew,
        role: 'model',
        type: 'text',
      });
      return {
        text: contentNew,
      };
    }

    if (response.functionCall) {
      const name = _.get(response.functionCall, 'name', '');
      await this.voiceConversationModel.create({
        user_oid: new ObjectId(user_oid),
        session_id: session_id,
        content: response.functionCall,
        role: 'model',
        type: 'function_call',
      });
      if (agents.actionClients.includes(name)) {
        return response.functionCall;
      }
      let dataFunction = '';
      let textResponse = '';
      if (name === 'read_news') {
        const news = await this.aiAgentService.readNewsV2(
          response.functionCall,
        );
        dataFunction = JSON.stringify(news, null, 2);
        textResponse = `Tin ${news.category.toLowerCase()}: ${news.title}. ${news.description}`;
      }
      if (name === 'gold_price') {
        const gold = await this.aiAgentService.priceGold();
        textResponse = gold.text;
      }

      if (name == 'weather') {
        const weather = await this.crawlService.crawlWeather(
          response.functionCall.args.location ?? 'Hà Nội',
        );
        textResponse = weather.text;
      }

      if (dataFunction) {
        await this.voiceConversationModel.create({
          user_oid: new ObjectId(user_oid),
          session_id: session_id,
          content: {
            name: name,
            response: {
              data: dataFunction,
            },
          },
          role: 'function',
          type: 'function',
        });
      }

      return {
        text: textResponse,
      };
    }
    return {
      text: getErrorMessage(),
    };
  }
}
