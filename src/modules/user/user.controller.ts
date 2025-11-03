import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { User } from '../../decorators/user.decorator';

@Controller('/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private service: UserService) {}

  @Delete('/')
  async deleteAccount(@User() { user_oid }: any) {
    return await this.service.deleteAccount(user_oid);
  }

  @Get('/profile')
  async profile(@User() { user_oid }: any) {
    return await this.service.infoUser(user_oid);
  }
}
