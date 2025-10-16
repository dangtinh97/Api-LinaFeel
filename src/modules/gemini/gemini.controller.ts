import { Controller, Post, Req } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('/gemini')
export class GeminiController {
  constructor(private geminiService: GeminiService) {}

  @Post('/emo-question-answer')
  async emoQA(@Req() { body }: any) {
    return await this.geminiService.emoQA(body);
  }
}
