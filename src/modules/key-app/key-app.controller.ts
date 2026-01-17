import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { KeyAppService } from './key-app.service';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { User } from '../../decorators/user.decorator';
import { UserService } from '../user/user.service';

@Controller('/key-app')
@UseGuards(JwtAuthGuard)
export class KeyAppController {
  constructor(
    private readonly keyAppService: KeyAppService,
    private readonly userService: UserService,
  ) {}

  @Post('/status')
  async setStatus(@Req() { body }: any) {
    const { key, status } = body;
    return await this.keyAppService.setStatus(key, status);
  }

  @Get('/checking')
  async checking() {
    return await this.keyAppService.checkAny();
  }

  @Get('/wake-word')
  async getKeyPicoVoice(@User() { user_oid }: any) {
    const user = await this.userService.infoUser(user_oid);
    if ((user.order_id ?? '').indexOf('GPA.') === -1) {
      return {};
    }
    return await this.keyAppService.getPicoVoice(user.order_id);
  }
}
