import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({
  collection: 'marketing_contents',
})
export class MarketingContent {
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

export const MarketingContentSchema =
  SchemaFactory.createForClass(MarketingContent);
