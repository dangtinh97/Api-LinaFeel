import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { lastValueFrom } from 'rxjs';
import * as _ from 'lodash';
import { HttpService } from '@nestjs/axios';
import { uuidv4 } from '../../common';

@Injectable()
export class XiaozhiService {
  constructor(private readonly httpService: HttpService) {}

  async registerXiaozhi():Promise<any> {
    const mac = this.randomMac();
    const curl = await lastValueFrom(
      this.httpService.post(
        'https://api.tenclass.net/xiaozhi/ota/',
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Device-Id': mac,
            'Client-Id': uuidv4().toString(),
            'X-Language': 'Chinese',
          },
        },
      ),
    );
    if (curl.status != 200) {
      return null;
    }
    const code = _.get(curl.data, 'activation.code');
    if (code == null) {
      return null
    }

    return {
      mac: mac,
      mcp: '',
      is_default: false,
      code: code,
      is_active: false,
    };
  }

  randomMac(): string {
    const bytes = randomBytes(5);

    return [
      '50',
      ...Array.from(bytes, (b) =>
        b.toString(16).padStart(2, '0').toUpperCase(),
      ),
    ].join(':');
  }
}