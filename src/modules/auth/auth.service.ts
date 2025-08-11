import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
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
    const token = this.jwtService.sign({
      sub: user._id.toString(),
    });
    return {
      user_oid: user._id.toString(),
      username: username,
      token: token,
    };
  }
}
