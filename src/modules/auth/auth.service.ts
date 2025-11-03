import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../app-config/app-config.service';
import { AppSettingKey } from '../app-config/schemas/app-setting.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private settingService: AppConfigService,
  ) {}

  async login(
    uidDevice: string,
    username: string,
    fullname: string,
    appVersion: number,
    language: string,
  ) {
    const user = await this.userService.updateOrCreate(
      username,
      fullname,
      uidDevice,
      appVersion,
      language,
    );

    const versionCurrent = await this.settingService.getByKeyConfig(
      AppSettingKey.APP_VERSION.toString(),
    );
    if (versionCurrent > appVersion) {
      throw new HttpException(
        {
          message: 'Update app new verstion',
        },
        4003,
      );
    }

    const token = this.jwtService.sign({
      sub: user._id.toString(),
    });
    return {
      user_oid: user._id.toString(),
      username: username,
      token: token,
      voice: user.voice ?? 'DEFAULT',
    };
  }
}
