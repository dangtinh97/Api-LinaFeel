import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTypes } from 'mongoose';
import { BaseModel } from '../../../shared/schemas/base.model';

@Schema({
  collection: 'voice_conversations',
})
export class VoiceConversation extends BaseModel {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
  })
  user_oid: mongoose.Types.ObjectId;

  @Prop()
  session_id: string;

  @Prop({
    type: SchemaTypes.Mixed,
  })
  content: any;

  @Prop()
  role: string;

  @Prop()
  type: string;
}

export const VoiceConversationSchema =
  SchemaFactory.createForClass(VoiceConversation);
