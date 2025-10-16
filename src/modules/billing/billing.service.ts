import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { AppConfig } from '../../app.config';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { KeyAppService } from '../key-app/key-app.service';
import { InjectModel } from '@nestjs/mongoose';
import { HistoryBilling } from './schemas/history-billing.schema';
import { Model } from 'mongoose';
@Injectable()
export class BillingService {
  constructor(
    private configService: ConfigService,
    private keyAppService: KeyAppService,
    @InjectModel(HistoryBilling.name)
    private readonly historyBillingModel: Model<HistoryBilling>,
  ) {}

  async verifyPurchase(purchaseToken: string) {
    const path = this.configService.get<AppConfig['GOOGLE_SERVICE_ACCOUNT']>(
      'GOOGLE_SERVICE_ACCOUNT',
    );
    const key = JSON.parse(fs.readFileSync(path) as any);
    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    const androidPublisher = google.androidpublisher({
      version: 'v3',
      auth,
    });
    try {
      const res = await androidPublisher.purchases.products.get({
        packageName: 'com.vudangtinh.emodesk',
        productId: 'donate_coffee_emo_desk',
        token: purchaseToken,
      });
      await this.historyBillingModel.create({
        order_id: res.data.orderId,
        data: res.data,
      });
      if (
        [0, 1].indexOf(res.data.purchaseState) !== -1 &&
        res.data.acknowledgementState === 1
      ) {
        const info: any = await this.keyAppService.getOrSetOrderId(
          res.data.orderId,
        );

        return { valid: true, ...(info?._doc ?? {}) };
      } else {
        return { valid: false, data: {} };
      }
    } catch (err) {
      console.error('❌ Verify failed:', err);
      return { valid: false, error: err };
    }
  }
}
