import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { KeyApp } from './schemas/key-app.schemas';
import { Model } from 'mongoose';
import { Orca } from '@picovoice/orca-node';
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
      time_last_check: new Date(),
      active: null,
      email: data.email,
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

  async checkKey(orderId: string) {
    const findOrder = await this.keyAppModel.findOne({
      order_id: orderId,
    });
    if (!findOrder) {
      return {
        message: 'not-error',
      };
    }
    const key = findOrder.picovoice_key;
    let active = false;
    try {
      const orca = new Orca(key);
      const { alignments } = orca.synthesize(this.wordRandom());
      orca.release();
      console.log();
      active = alignments.length > 0;
    } catch (e) {
      console.log(e);
    }
    await this.keyAppModel.findOneAndUpdate(
      {
        _id: findOrder._id,
      },
      {
        $set: {
          active: active,
          time_last_check: new Date(),
        },
      },
    );
    return true;
  }

  wordRandom() {
    const words = [
      'apple',
      'river',
      'mountain',
      'sky',
      'dream',
      'music',
      'light',
      'shadow',
      'fire',
      'stone',
      'water',
      'wind',
      'flower',
      'cloud',
      'forest',
      'ocean',
      'storm',
      'time',
      'sun',
      'moon',
      'earth',
      'star',
      'heart',
      'mind',
      'voice',
      'peace',
      'power',
      'hope',
      'fear',
      'love',
      'sleep',
      'smile',
      'cry',
      'laugh',
      'dance',
      'build',
      'create',
      'destroy',
      'run',
      'jump',
      'think',
      'learn',
      'grow',
      'shine',
      'fall',
      'bright',
      'dark',
      'strong',
      'soft',
      'wild',
    ];
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2).join(' ');
  }

  async checkAny() {
    const getCheck = await this.keyAppModel.findOne({
      active: true,
      time_last_check: {
        $lt: new Date(new Date().getTime() - 1000 * 60 * 60 * 2),
      },
    });
    if (!getCheck) {
      return {};
    }
    await this.checkKey(getCheck.order_id);
    return {
      _id: getCheck._id.toString(),
    };
  }
}
