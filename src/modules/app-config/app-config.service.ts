import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  constructor() {}
  
  async verifyPurchase(){
    const key = JSON.parse(process.env.GOOGLE_API_KEY);
  }
}
