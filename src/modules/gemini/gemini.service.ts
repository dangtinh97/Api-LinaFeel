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
    console.log(JSON.stringify(messages));
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
}
