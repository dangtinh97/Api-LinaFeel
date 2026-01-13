import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../app.config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as _ from 'lodash';
import * as dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { CrawlService } from '../crawl/crawl.service';
import { getErrorMessage, GOLD_KEYWORDS, NEWS } from '../../common/keyword';
import { uuidv4 } from '../../common';
import { MoneyJournalService } from '../money-journal/money-journal.service';
import { ObjectId } from 'mongodb';
import { AppConfigService } from '../app-config/app-config.service';
import { AppSettingKey } from '../app-config/schemas/app-setting.schema';
import { UserService } from '../user/user.service';
import { AgentService } from './agent.service';
dayjs.locale('vi');
@Injectable()
export class GeminiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly crawlService: CrawlService,
    private readonly moneyJournalService: MoneyJournalService,
    private readonly appConfigService: AppConfigService,
    private readonly userService: UserService,
    private readonly aiAgentService: AgentService,
  ) {}

  async chat(messages: any[]) {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const apiKey =
      this.configService.get<AppConfig['GEMINI_API_KEY']>('GEMINI_API_KEY');
    const curl = await lastValueFrom(
      this.httpService.post(
        url,
        {
          system_instruction: {
            parts: [
              {
                text: 'Bạn là chuyên gia tư vấn tâm lý, tên của bạn là Lina. Bạn nói chuyện với 1 tính cách lắng nghe và không phán xét. Đưa ra những câu nói hoặc câu hỏi phù hợp, nội dung không quá dài.',
              },
            ],
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_LOW_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_LOW_AND_ABOVE',
            },
          ],
          contents: messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
          },
        },
      ),
    );
    const block = _.get(curl.data, 'candidates.0.finishReason', '');
    const messageError =
      block === 'SAFETY'
        ? 'Nội dung bị chặn vì lý do an toàn'
        : 'Tôi mệt quá, cần nghỉ ngơi chút, bạn quay lại sau nhé.';
    return _.get(
      curl.data,
      'candidates.0.content.parts.0.text',
      messageError,
    ).replaceAll('\n', '');
  }
  getRandomSupportMessage() {
    const messages = [
      "Emo đói quá rồi... mua cho Emo hộp sữa nha 🍼",
      "Ủng hộ nhà phát triển để Emo có thêm năng lượng yêu đời hơn 💖",
      "Một ly sữa nhỏ từ bạn là niềm vui to lớn của Emo đó~ 🥰",
      "Nếu bạn thấy Emo dễ thương, mời Emo ly sữa để Emo vui hơn nhé ☕",
      "Emo cảm ơn bạn rất nhiều! Emo cần sữa để tiếp tục trò chuyện với bạn nhiều hơn 💫"
    ];

    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }
  async emoQA({ contents, name, personality, session_id, user_oid, hass }) {
    let keyFindApiKey = AppSettingKey.GEMINI_KEY_API;
    const user = await this.userService.infoUser(user_oid ?? new ObjectId());
    if (user && (user.order_id ?? '').indexOf('GPA') !== -1) {
      keyFindApiKey = AppSettingKey.GEMINI_KEY_API_VIP;
    }

    if (
      user &&
      (user.order_id ?? '').indexOf('GPA') === -1 &&
      contents.length > 6
    ) {
      return {
        status: 204,
        text: this.getRandomSupportMessage(),
        session_id: session_id,
      };
    }

    const keys = await this.appConfigService.getByKeyConfig(keyFindApiKey);
    let key = '';
    if (typeof keys === 'string') {
      key = keys;
    } else {
      const random = Math.floor(Math.random() * keys.length);
      key = keys[random];
    }
    const userAsk = contents.filter((item: any) => item.role === 'user');
    session_id = session_id ?? uuidv4();
    if (userAsk.length == 0)
      return {
        status: 204,
        text: 'Xin chào mình là emo bạn có muốn trò chuyện cùng mình không?',
        session_id: session_id,
      };
    const callAgent = await this.aiAgentService.analyzeContent({
      key,
      contents,
      user_oid,
      hass,
    });
    if (callAgent && (callAgent.status === 403 || callAgent.status === 200)) {
      return {
        ...callAgent,
      };
    }
    const content = await this.createContents({
      contents,
      key: key,
      name,
      personality,
    });

    return {
      ...content,
      session_id: session_id,
    };
  }

  async createContents({ contents, key, name, personality }) {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
    contents = this.mapContent(contents);
    const time = dayjs(new Date())
      .add(7, 'hours')
      .format('dddd, HH:mm DD/MM/YYYY')
      .toString();
    const prompt = `
Bạn là trợ lý ảo thông minh tên Emo.${
      personality.trim() ? ` Bạn có tính cách ${personality.trim()}.` : ''
    }${name.trim() ? ` Tên của tôi là ${name.trim()}.` : ''}
Luôn trả lời ngắn gọn, tự nhiên như đang nói chuyện, không chứa ký tự đặc biệt hay emoji.
Thông tin bổ sung:
- Thời gian ở Việt Nam hiện tại là: ${time}
`.trim();
    const body = {
      system_instruction: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      contents: contents,
    };

    console.log(JSON.stringify(body, null, 2));
    try {
      const curl = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': key,
          },
        }),
      );
      if (curl.status != 200) {
        return {
          status: curl.status,
          text: getErrorMessage(),
        };
      }
      const text = _.get(
        curl.data,
        'candidates.0.content.parts.0.text',
        getErrorMessage(),
      )
        .replaceAll('\n', '')
        .trim();
      return {
        status: 200,
        text: text.replaceAll('*', ''),
      };
    } catch (e) {
      console.log(e.message);
      return {
        status: 403,
        text: getErrorMessage(),
      };
    }
  }

  mapContent(contents: any[]) {
    return contents.map((item) => {
      return {
        role: item.role === 'user' ? 'user' : 'model',
        parts: [
          {
            text: item.text ?? '',
          },
        ],
      };
    });
  }

  public async getKey(keyFindApiKey: string): Promise<string> {
    const keys = await this.appConfigService.getByKeyConfig(keyFindApiKey);
    let key = '';
    if (typeof keys === 'string') {
      key = keys;
    } else {
      const random = Math.floor(Math.random() * keys.length);
      key = keys[random];
    }
    return key;
  }

  async curl(data: any, apiKey: string) {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
    try {
      const curl = await lastValueFrom(
        this.httpService.post(
          url,
          { ...data },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': apiKey,
            },
          },
        ),
      );
      const text = _.get(curl.data, 'candidates.0.content.parts.0.text', null);
      const functionCall = _.get(
        curl.data,
        'candidates.0.content.parts.0.functionCall',
        null,
      );
      if (text) {
        return { text };
      }
      if (functionCall) {
        return { functionCall };
      }
      return curl.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
