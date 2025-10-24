import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MoneyJournal } from './schemas/money-journal.schema';
import { Model } from 'mongoose';

@Injectable()
export class MoneyJournalService {
  constructor(
    @InjectModel(MoneyJournal.name)
    private readonly moneyJournalModel: Model<MoneyJournal>,
  ) {}

  async addJournal(data: any) {
    await this.moneyJournalModel.create(data);
  }

  async list() {
    return await this.moneyJournalModel
      .find()
      .sort({
        _id: -1,
      })
      .exec();
  }
}
