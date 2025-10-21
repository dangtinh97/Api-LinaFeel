import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  collection: 'news',
})
export class News {
  @Prop()
  category: string;
  @Prop()
  title: string;

  @Prop()
  description: string;
  @Prop({ unique: true })
  url: string;

  @Prop()
  summary: string;

  @Prop()
  published_at: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);
