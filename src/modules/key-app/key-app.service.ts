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
    return await this.keyAppModel
      .findOneAndUpdate(
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
      )
      .exec();
  }

  async getAllByOrderIds(orderIds: string[]) {
    return await this.keyAppModel
      .find({
        order_id: {
          $in: orderIds,
        },
      })
      .exec();
  }

  async saveKey(data: any) {
    return await this.keyAppModel.create({
      order_id: data.order_id,
      gemini_key: data.gemini_key,
      picovoice_key: data.picovoice_key,
      picovoice_file: data.picovoice_file,
      use: false,
    });
  }

  async setStatus(key: string, status: boolean) {
    return await this.keyAppModel
      .findOneAndUpdate(
        {
          picovoice_key: key,
        },
        {
          $set: {
            use: status,
          },
        },
      )
      .exec();
  }
}
