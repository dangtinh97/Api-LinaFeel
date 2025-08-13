import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';

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
}
