import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { BaseModel } from '../../../shared/schemas/base.model';

@Schema({
  collection: 'messages',
})
export class Message extends BaseModel {
  @Prop()
  session_id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
  })
  user_oid: mongoose.Types.ObjectId;

  @Prop()
  message: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
