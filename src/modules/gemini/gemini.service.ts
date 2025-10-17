import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../app.config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as _ from 'lodash';

@Injectable()
export class GeminiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
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

  async emoQA({ contents, key, name, personality }) {
    const callAgent = await this.curlAgent(
      contents[contents.length - 1].text,
      key,
    );
    if (callAgent.args || callAgent.status === 403) {
      return callAgent;
    }

    return await this.createContents({ contents, key, name, personality });
  }

  async createContents({ contents, key, name, personality }) {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    contents = this.mapContent(contents);

    const prompt = `
Bạn là trợ lý ảo thông minh tên Emo.${
      personality.trim() ? ` Bạn có tính cách ${personality.trim()}.` : ''
    }${name.trim() ? ` Tên của tôi là ${name.trim()}.` : ''}
Luôn trả lời ngắn gọn, tự nhiên như đang nói chuyện, không chứa ký tự đặc biệt hay emoji.
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
        text: text,
      };
    } catch (e) {
      console.log(e.message);
      return {
        status: 403,
        text: 'Emo quá mệt rồi, quá mỏi rồi, tôi sẽ đi ngủ 1 chút',
      };
    }
  }

  async curlAgent(text: string, apiKey: string) {
    let action = false;
    ['mở', 'phát', 'bật', 'cho tôi', 'tôi muốn', 'nghe'].forEach(
      (itemAction) => {
        if (text.toLowerCase().indexOf(itemAction) !== -1) {
          action = true;
        }
      },
    );
    let intent = '';
    const allowResultTakePhoto = ['chụp ảnh', 'chụp hình', 'máy ảnh'];
    [...allowResultTakePhoto, 'bài hát', 'ca khúc'].forEach((itemIntent) => {
      if (text.toLowerCase().indexOf(itemIntent) !== -1) {
        intent = itemIntent;
      }
    });
    if (!action) {
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

    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
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
          ],
        },
      ],
    };
    try {
      const curl = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
          },
        }),
      );
      console.log(curl);
      if (curl.status != 200) {
        return {
          status: curl.status,
          text: 'Emo quá mệt rồi, quá mỏi rồi, tôi sẽ đi ngủ 1 chút',
        };
      }
      const functionCall = _.get(
        curl.data,
        'candidates.0.content.parts.0.functionCall',
        {
          status: 204,
          text: '',
        },
      );
      return functionCall;
    } catch (e) {
      return {
        status: 403,
        text: 'Emo quá mệt rồi, quá mỏi rồi, tôi sẽ đi ngủ 1 chút',
      };
    }
  }

  mapContent(contents: any[]) {
    return contents.map((item) => {
      return {
        role: item.model === 'user' ? 'user' : 'model',
        parts: [
          {
            text: item.text ?? '',
          },
        ],
      };
    });
  }
}
