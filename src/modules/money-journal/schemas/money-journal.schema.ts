import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

@Schema({
  collection: 'money_journal',
})
export class MoneyJournal {
  @Prop()
  action: string;

  @Prop()
  money: number;

  @Prop()
  note: string;

  @Prop()
  category: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
  })
  user_oid: mongoose.Types.ObjectId;
}

export const MoneyJournalSchema = SchemaFactory.createForClass(MoneyJournal);
