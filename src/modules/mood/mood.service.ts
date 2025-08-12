import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Mood } from './schemas/mood.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class MoodService {
  constructor(
    @InjectModel(Mood.name)
    private moodModel: Model<Mood>,
  ) {}

  async addMood(userOid: string, mood: string) {
    return await this.moodModel.create({
      user_oid: new ObjectId(userOid),
      key: mood.toUpperCase(),
      time: new Date(),
    });
  }

  async findMoodById(oid: string) {
    if (!ObjectId.isValid(oid)) {
      return null;
    }
    return await this.moodModel
      .findOne({
        _id: new ObjectId(oid),
      })
      .exec();
  }
}
