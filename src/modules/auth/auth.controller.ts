import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { HeaderGuard } from '../../guards/header.guard';
import { AuthService } from './auth.service';

@Controller('/auth')
@UseGuards(HeaderGuard)
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('/login')
  async login(@Req() req: Request) {
    const uidDevice = req.headers['uid-device'];
    const appVersion = parseInt(req.headers['app-version'] ?? '0');
    const lang = req.headers['lang'] ?? 'en';
    const username = req.body['username'] ?? uidDevice;
    const fullname = req.body['full_name'] ?? uidDevice;
    return await this.service.login(
      uidDevice,
      username,
      fullname,
      appVersion,
      lang,
    );
  }
}
