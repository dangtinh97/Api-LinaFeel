import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({
  collection: 'logs_gemini',
})
class LogGemini {
  @Prop()
  session_id: string;
  @Prop()
  input: string;
  @Prop()
  role: string;
  @Prop()
  result: string;
  @Prop({
    type: SchemaTypes.Mixed,
  })
  agent: any;

  @Prop({
    type: SchemaTypes.ObjectId,
  })
  user_oid: ObjectId;
}

export default LogGemini;

export const LogGeminiSchema = SchemaFactory.createForClass(LogGemini);
