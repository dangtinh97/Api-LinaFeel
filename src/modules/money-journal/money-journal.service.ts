import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MoneyJournal } from './schemas/money-journal.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class MoneyJournalService {
  constructor(
    @InjectModel(MoneyJournal.name)
    private readonly moneyJournalModel: Model<MoneyJournal>,
  ) {}

  async addJournal(data: any) {
    await this.moneyJournalModel.create(data);
  }

  async list(user_id: any) {
    return await this.moneyJournalModel
      .find({
        user_oid: new ObjectId(user_id),
      })
      .sort({
        _id: -1,
      })
      .exec();
  }

  async deleteMoney(id: string) {
    return await this.moneyJournalModel.findOneAndDelete({
      _id: new ObjectId(id),
    }).exec();
  }
}
