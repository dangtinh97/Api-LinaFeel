import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { BaseModel } from '../../../shared/schemas/base.model';

@Schema({
  collection: 'moods',
})
export class Mood extends BaseModel {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
  })
  user_oid: mongoose.Types.ObjectId;

  @Prop()
  time: Date;

  @Prop()
  key: string;
}

export const MoodSchema = SchemaFactory.createForClass(Mood);
/*
*   @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: mongoose.Types.ObjectId;
* 
* */
