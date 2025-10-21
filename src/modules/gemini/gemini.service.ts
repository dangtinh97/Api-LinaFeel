import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../app.config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as _ from 'lodash';
import * as dayjs from 'dayjs';
import { CrawlService } from '../crawl/crawl.service';
import { GOLD_KEYWORDS, NEWS } from '../../common/keyword';
import { uuidv4 } from '../../common';

@Injectable()
export class GeminiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly crawlService: CrawlService,
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

  async emoQA({ contents, key, name, personality, session_id }) {
    const userAsk = contents.filter((item) => item.role === 'user');
    session_id = session_id ?? uuidv4();
    if (userAsk.length == 0)
      return {
        status: 204,
        text: 'Xin chào mình là emo bạn có muốn trò chuyện cùng mình không?',
        session_id: session_id,
      };
    if (this.isAskGoldPrice(userAsk[userAsk.length - 1].text)) {
      const ansGold = await this.crawlService.goldPrice();
      return {
        status: ansGold ? 200 : 400,
        text: ansGold ?? 'Hiện tại chưa có thông tin giá vàng',
        session_id: session_id,
      };
    }
    const callAgent = await this.curlAgent(
      session_id,
      userAsk[userAsk.length - 1].text,
      key,
    );
    if (callAgent.status == 403)
      return {
        ...callAgent,
      };
    if (
      callAgent.args &&
      ['open_music', 'take_photo'].includes(callAgent.name)
    ) {
      return {
        ...callAgent,
        session_id: session_id,
      };
    }

    if (callAgent.name === 'read_news') {
      const news = await this.crawlService.getRandomNews(
        callAgent.args.category ?? 'ALL',
      );
      console.log(news);
      return {
        status: 200,
        text: this.formatNews(news),
        session_id: session_id,
      };
    }

    const content = await this.createContents({
      contents,
      key,
      name,
      personality,
    });

    return {
      ...content,
      session_id: session_id,
    };
  }

  formatNews({ category, title, description }) {
    return `Tin ${category.toLowerCase()}: ${title}. ${description}`;
  }

  async createContents({ contents, key, name, personality }) {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    contents = this.mapContent(contents);
    const time = dayjs(new Date())
      .add(7, 'hours')
      .format('HH:mm DD/MM/YYYY')
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
          text: 'Emo quá mệt rồi, quá mỏi rồi, tôi sẽ đi ngủ 1 chút',
        };
      }
      const text = _.get(
        curl.data,
        'candidates.0.content.parts.0.text',
        'Emo quá mệt rồi, quá mỏi rồi, tôi sẽ đi ngủ 1 chút.',
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
        text: 'Emo quá mệt rồi, quá mỏi rồi, tôi sẽ đi ngủ 1 chút',
      };
    }
  }
  async curlAgent(sessionId: string, text: string, apiKey: string) {
    let action = false;
    ['mở', 'phát', 'bật', 'cho tôi', 'tôi muốn', 'nghe', 'tìm'].forEach(
      (itemAction) => {
        if (text.toLowerCase().indexOf(itemAction) !== -1) {
          action = true;
        }
      },
    );
    let intent = '';
    const allowResultTakePhoto = ['chụp ảnh', 'chụp hình', 'máy ảnh'];
    [
      ...allowResultTakePhoto,
      'bài hát',
      'ca khúc',
      'tin tức',
      'bài báo',
    ].forEach((itemIntent) => {
      if (text.toLowerCase().indexOf(itemIntent) !== -1) {
        intent = itemIntent;
      }
    });
    if (!action && !intent) {
      return {
        status: 204,
        text: '',
      };
    }
    if (intent != '' && allowResultTakePhoto.includes(intent))
      return {
        name: 'talk_photo',
        args: {
          intent: intent,
        },
      };
    const categoryNews = NEWS.map((item) => {
      return item.category;
    });
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
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
          functionDeclarations: [
            {
              name: 'open_music',
              description:
                'Analyze content to return song name or singer name when asked to open music.',
              parameters: {
                type: 'object',
                properties: {
                  name_song: {
                    type: 'string',
                    description: 'Song name or singer name',
                  },
                },
                required: ['name_song'],
              },
            },
            {
              name: 'read_news',
              description:
                'Content analysis to return news opening requests, news categories',
              parameters: {
                type: 'object',
                properties: {
                  is_read: {
                    type: 'boolean',
                    description:
                      'Is the request to open the news, open the newspaper?',
                  },
                  category: {
                    type: 'string',
                    enum: categoryNews.concat('ALL'),
                    description:
                      "Information on news type. If no category is selected, return 'ALL'",
                  },
                },
                required: ['is_read'],
              },
            },
          ],
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
          status: curl.status,
          text: 'Emo quá mệt rồi, quá mỏi rồi, tôi sẽ đi ngủ 1 chút',
        };
      }
      return _.get(curl.data, 'candidates.0.content.parts.0.functionCall', {
        status: 204,
        text: '',
      });
    } catch (e) {
      console.log(e.message);
      return {
        status: 403,
        text: 'Emo quá mệt rồi, quá mỏi rồi, tôi sẽ đi ngủ 1 chút',
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

  isAskGoldPrice(message: string) {
    const text = message.toLowerCase();
    return GOLD_KEYWORDS.some((keyword: string) => text.includes(keyword));
  }
}
