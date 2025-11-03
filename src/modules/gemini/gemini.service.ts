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
import { MoneyJournalService } from '../money-journal/money-journal.service';
import { ObjectId } from 'mongodb';
import { AppConfigService } from '../app-config/app-config.service';
import { AppSettingKey } from '../app-config/schemas/app-setting.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class GeminiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly crawlService: CrawlService,
    private readonly moneyJournalService: MoneyJournalService,
    private readonly appConfigService: AppConfigService,
    private readonly userService: UserService,
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

  async emoQA({ contents, name, personality, session_id, user_oid }) {
    let keyFindApiKey = AppSettingKey.GEMINI_KEY_API;
    const user = await this.userService.infoUser(user_oid ?? new ObjectId());
    if (user && user.expired.getTime() > new Date().getTime()) {
      keyFindApiKey = AppSettingKey.GEMINI_KEY_API_VIP;
    }
    const key = await this.appConfigService.getByKeyConfig(keyFindApiKey);
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

    if (callAgent.name === 'use_money') {
      this.moneyJournalService
        .addJournal({
          ...callAgent.args,
          user_oid: new ObjectId(user_oid),
        })
        .then();
      return {
        status: 200,
        text: this.getMessageFinance(callAgent.args),
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

  formatNews({ category, title, description }) {
    return `Tin ${category.toLowerCase()}: ${title}. ${description}`;
  }

  async createContents({ contents, key, name, personality }) {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
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
          text: this.getErrorMessage(),
        };
      }
      const text = _.get(
        curl.data,
        'candidates.0.content.parts.0.text',
        this.getErrorMessage(),
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
        text: this.getErrorMessage(),
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
    const intentFinace = [
      'tiêu',
      'chi',
      'mua',
      'trả',
      'đóng',
      'nạp',
      'bỏ ra',
      'tốn',
      'hết',
      'mất',
      'xài',
      'dùng',
      'nhận',
    ];
    [
      ...allowResultTakePhoto,
      ...intentFinace,
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
            {
              name: 'use_money',
              description: 'Phân tích nội dung về việc chi tiêu.',
              parameters: {
                type: 'object',
                properties: {
                  money: {
                    type: 'integer',
                    description: 'Số tiền đã tiêu',
                  },
                  action: {
                    type: 'string',
                    enum: ['chi', 'thu'],
                    description:
                      "Loại hành động tài chính — 'chi' nếu là chi tiêu, 'thu' nếu là thu nhập.",
                  },
                  category: {
                    type: 'string',
                    enum: [
                      'ăn uống',
                      'mua sắm',
                      'nhà cửa',
                      'xe cộ',
                      'giải trí',
                      'lương',
                      'đầu tư',
                      'khác',
                    ],
                    description: 'Phân loại chi tiêu hoặc nguồn thu nhập.',
                  },
                  note: {
                    type: 'string',
                    description:
                      "Ghi chú thêm về giao dịch (ví dụ: 'ăn trưa với bạn', 'mua quần áo', 'lương tháng 10').",
                  },
                },
                required: ['money', 'action', 'category'],
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
          text: this.getErrorMessage(),
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
        text: this.getErrorMessage(),
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

  getErrorMessage() {
    const phrases = [
      'Emo thấy hơi quá sức rồi… để tôi nghỉ một lát nhé.',
      'Tôi đang cảm thấy nặng nề quá… cần tĩnh lại chút xíu.',
      'Emo hơi rối… đầu óc quay cuồng, tôi sẽ dừng lại một lúc.',
      'Xin lỗi, tôi cần nghỉ để lấy lại năng lượng.',
      'Mọi thứ hơi hỗn loạn… Emo cần thời gian sắp xếp lại.',
      'Tôi thấy hệ thống hoạt động không ổn lắm… để tôi khởi động lại.',
      'Emo mệt quá rồi… cho tôi tắt yên lặng một lúc được không?',
      'Tôi cảm thấy như mình đang quá tải… cần nghỉ để phục hồi.',
      'Xin lỗi, tôi không ổn… Emo sẽ nghỉ ngơi chút rồi quay lại.',
      'Tôi… không còn đủ năng lượng nữa… cho tôi ngủ một giấc nhé.',
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  getMessageFinance(data: any) {
    const minusMessage = [
      'Đã thêm vào chi tiêu {money} cho việc {note}. Ghi nhớ rồi nha!',
      '{money} đã bay đi cho việc {note}. Emo đã lưu lại.',
      'Ok, đã ghi {money} tiêu cho {note}.',
      'Xong! Chi {money} cho {note} đã được cập nhật.',
      'Chi tiêu {money} cho {note}, sổ đã có dấu tick xanh rồi!',
      'Emo đã lưu chi {money} cho {note}. Đừng quên kiểm tra ví nhé!',
      'Đã cộng vào danh sách chi tiêu: {money} cho {note}.',
      'Hoàn tất! {money} cho {note} đã nằm gọn trong báo cáo.',
      '{note} tốn {money} hả, Emo đã ghi nhận rồi.',
      'Okie, đã thêm giao dịch {money} cho {note}.',
    ];

    const addMessage = [
      'Đã ghi nhận thu nhập {money} từ việc {note}.',
      '{money} đã được cộng vào sổ thu cho việc {note}.',
      'Ok, Emo đã lưu thu nhập {money} từ {note}.',
      'Xong! Đã thêm giao dịch thu {money} cho {note}.',
      'Emo đã cập nhật: thu về {money} từ {note}.',
      'Ghi chú rồi nha! Bạn vừa nhận {money} cho {note}.',
      'Đã cộng {money} vào tổng thu nhập, nguồn: {note}.',
      'Thu nhập {money} từ {note} đã được Emo lưu lại.',
      'Đã hoàn tất thêm thu nhập {money} từ {note}.',
      'Giao dịch thu {money} cho {note} đã nằm gọn trong báo cáo rồi nha.',
    ];
    let message = '';
    if (data.action == 'chi') {
      message = minusMessage[Math.floor(Math.random() * minusMessage.length)];
    } else {
      message = addMessage[Math.floor(Math.random() * addMessage.length)];
    }

    return message
      .replace(
        '{money}',
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(data.money),
      )
      .replace('{note}', data.note.toString());
  }
}
