import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AppSetting } from './schemas/app-setting.schema';
import { Model } from 'mongoose';

@Injectable()
export class AppConfigService {
  constructor(
    @InjectModel(AppSetting.name)
    private readonly appConfigModel: Model<AppSetting>,
  ) {}

  async verifyPurchase() {
    const key = JSON.parse(process.env.GOOGLE_API_KEY);
  }

  async getByKeyConfig(key: string) {
    return (
      (
        await this.appConfigModel.findOne({
          key: key,
        })
      ).data ?? null
    );
  }
}
