import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { KeyApp } from './schemas/key-app.schemas';
import { Model } from 'mongoose';

@Injectable()
export class KeyAppService {
  constructor(
    @InjectModel(KeyApp.name)
    private keyAppModel: Model<KeyApp>,
  ) {}

  async getOrSetOrderId(orderId: string) {
    const find = await this.keyAppModel.findOne({
      order_id: orderId,
    });
    if (find) {
      return find;
    }
    return await this.keyAppModel.findOneAndUpdate(
      {
        order_id: {
          $exists: false,
        },
      },
      {
        $set: {
          order_id: orderId,
        },
      },
      {
        returnDocument: 'after',
      },
    ).exec();
  }
}
