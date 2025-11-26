import { Controller, Post, Req } from '@nestjs/common';
import { MarketingService } from './marketing.service';

@Controller('/marketing')
export class MarketingController {
  constructor(
    private readonly marketingService:MarketingService
  ) {}

  @Post('/ai-support')
  async aiSupport(@Req() { body }: any) {
    return await this.marketingService.aiSupport(body);
  }
}
