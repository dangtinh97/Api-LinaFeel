import { Controller, Post, Req } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { LogService } from '../log/log.service';
import { payloadFromToken } from '../../common';
import { ObjectId } from 'mongodb';

@Controller('/gemini')
export class GeminiController {
  constructor(
    private geminiService: GeminiService,
    private logService: LogService,
  ) {}

  @Post('/emo-question-answer')
  async emoQA(@Req() { body, headers }: any) {
    const { authorization } = headers;
    console.log(headers);
    const payload = payloadFromToken(authorization);
    console.log(payload)
    const result = await this.geminiService.emoQA({
      ...body,
      user_oid: payload.sub,
    });
    const userAsk = (body.contents ?? []).filter(
      (item) => item.role === 'user',
    );
    await this.logService.logGemini({
      user_oid: payload.sub ? new ObjectId(payload.sub) : null,
      input: userAsk.length > 0 ? userAsk[0].text : '',
      result: result.text ?? '',
      session_id: result.session_id ?? '',
    });
    return result;
  }
}
