import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Journal } from './schemas/journal.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class JournalService {
  constructor(
    @InjectModel(Journal.name)
    private readonly journalModel: Model<Journal>,
  ) {}

  async create(userOid: string, content: string) {
    return await this.journalModel.create({
      user_oid: new ObjectId(userOid),
      content: content,
    });
  }

  async list(userOid: string) {
    return await this.journalModel
      .find({
        user_oid: new ObjectId(userOid),
      })
      .sort({ _id: 'desc' })
      .exec();
  }

  async update(oid: string, content: string) {
    return await this.journalModel
      .findOneAndUpdate(
        {
          _id: new ObjectId(oid),
        },
        {
          $set: {
            content: content,
          },
        },
      )
      .exec();
  }
}
