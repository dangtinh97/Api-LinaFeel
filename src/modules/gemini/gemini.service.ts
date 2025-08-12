import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../app.config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

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
    console.log(curl.data);
  }
}
