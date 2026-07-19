import { Controller, Delete, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { User } from '../../decorators/user.decorator';
import { AppConfigService } from '../app-config/app-config.service';
import { XiaozhiService } from '../xiaozhi/xiaozhi.service';

@Controller('/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private service: UserService,
    private appConfigService: AppConfigService,
    private xiaozhiService: XiaozhiService
  ) {}

  @Delete('/')
  async deleteAccount(@User() { user_oid }: any) {
    return await this.service.deleteAccount(user_oid);
  }

  @Get('/profile')
  async profile(@User() { user_oid }: any, @Query() query: any) {
    const user: any = await this.service.infoUser(user_oid);
    if (
      user.ai == null &&
      typeof user.order_id != 'undefined' &&
      user.order_id.toString().indexOf('GPA')==0
    ) {
      const ai = await this.xiaozhiService.registerXiaozhi();
      console.log(ai)
      if (ai != null) {
        user.ai = ai;
        await this.service.update(
          user_oid,ai
        )
      }
    }
    if (user.ai == null) {
      user.ai = await this.appConfigService.getXiaozhi(query.language);
    }
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
