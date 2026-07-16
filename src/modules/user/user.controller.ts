import { Controller, Delete, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { User } from '../../decorators/user.decorator';
import { AppConfigService } from '../app-config/app-config.service';

@Controller('/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private service: UserService,
    private appConfigService: AppConfigService,
  ) {}

  @Delete('/')
  async deleteAccount(@User() { user_oid }: any) {
    return await this.service.deleteAccount(user_oid);
  }

  @Get('/profile')
  async profile(@User() { user_oid }: any, @Query() language: any) {
    const user: any = await this.service.infoUser(user_oid);
    const xiaozhiConfig =
      await this.appConfigService.getByKeyConfig('XIAOZHI_DEFAULT');
    const xiapzhiResponse =
      xiaozhiConfig[language.language ?? 'vi'] ?? xiaozhiConfig['vi'];
    user.ai = xiapzhiResponse;
    return user;
  }

  @Patch('/profile')
  async updateProfile(@User() { user_oid }: any, @Req() {body}: any) {
    if (typeof body.mcp!=='undefined'){
      await this.service.update(user_oid,{
        'ai.mcp': body['mcp']
      })
    }

    if (typeof body.is_active !== 'undefined') {
      await this.service.update(user_oid, {
        'ai.is_active': body['is_active'],
      });
    }

    return {};
  }
}
