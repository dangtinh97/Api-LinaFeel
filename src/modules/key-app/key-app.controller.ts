import { Controller, Get, Post, Req } from '@nestjs/common';
import { KeyAppService } from './key-app.service';

@Controller('/key-app')
export class KeyAppController {
  constructor(private readonly keyAppService: KeyAppService) {}

  @Post('/status')
  async setStatus(@Req() { body }: any) {
    const { key, status } = body;
    return await this.keyAppService.setStatus(key, status);
  }
  
  @Get('/checking')
  async checking(){
    return await this.keyAppService.checkAny();
  }
}
