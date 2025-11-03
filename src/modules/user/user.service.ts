import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import * as dayjs from 'dayjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async updateOrCreate(
    username: string,
    fullname: string,
    uidDevice: string,
    appVersion: number,
    lang: string,
  ) {
    return await this.userModel
      .findOneAndUpdate(
        { username: username },
        {
          $set: {
            language: lang,
            uid_device: uidDevice,
            app_version: appVersion,
            full_name: fullname,
          },
          $setOnInsert: {
            expired: dayjs().add(1, 'day').toDate(),
            voice: 'DEFAULT',
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
  }

  async deleteAccount(userOid: string) {
    return await this.userModel
      .findOneAndUpdate(
        {
          _id: new ObjectId(userOid),
        },
        [
          {
            $set: {
              username: { $concat: ['DELETE_', '$username'] },
            },
          },
        ],
        { new: true },
      )
      .exec();
  }

  async infoUser(userOid: string) {
    return await this.userModel
      .findOne({
        _id: new ObjectId(userOid),
      })
      .exec();
  }
}
