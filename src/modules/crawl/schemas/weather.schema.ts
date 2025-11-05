import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseModel } from '../../../shared/schemas/base.model';
import { SchemaTypes } from 'mongoose';

@Schema({
  collection: 'weathers',
})
export class Weather extends BaseModel {
  @Prop()
  location: string;

  @Prop({
    type: SchemaTypes.Mixed,
  })
  data: any;
}

export const WeatherSchema = SchemaFactory.createForClass(Weather);
