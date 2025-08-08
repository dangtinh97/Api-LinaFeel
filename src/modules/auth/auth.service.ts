import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor() {}

  async login(
    uidDevice: string,
    username: string,
    appVersion: number,
    language: string,
  ) {}
}
