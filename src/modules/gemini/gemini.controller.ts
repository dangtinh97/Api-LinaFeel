import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { LogService } from '../log/log.service';
import { payloadFromToken } from '../../common';
import { ObjectId } from 'mongodb';
import { JwtAuthGuard } from '../../guards/auth.guard';

@Controller('/gemini')
@UseGuards(JwtAuthGuard)
export class GeminiController {
  constructor(
    private geminiService: GeminiService,
    private logService: LogService,
  ) {}

  @Post('/emo-question-answer')
  async emoQA(@Req() { body, headers }: any) {
    const { authorization } = headers;
    const payload = payloadFromToken(authorization);
    const result = await this.geminiService.emoQA({
      ...body,
      user_oid: payload.sub,
    });
    const userAsk = (body.contents ?? []).filter(
      (item) => item.role === 'user',
    );
    await this.logService.logGemini({
      user_oid: payload.sub ? new ObjectId(payload.sub) : null,
      input: userAsk.length > 0 ? userAsk[userAsk.length - 1].text : '',
      result: result.text ?? '',
      session_id: result.session_id ?? '',
    });
    return result;
  }
}
