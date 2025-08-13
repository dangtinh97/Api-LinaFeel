import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseModel } from '../../../shared/schemas/base.model';
import mongoose from 'mongoose';

@Schema({
  collection: 'journals',
})
export class Journal extends BaseModel {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
  })
  user_oid: mongoose.Types.ObjectId;

  @Prop()
  content: string;
}

export const JournalSchema = SchemaFactory.createForClass(Journal);
