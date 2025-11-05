import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({
  collection: 'locations',
})
export class Location {
  @Prop()
  name: string;

  @Prop({
    type: SchemaTypes.Mixed,
  })
  location: any;

  @Prop({
    type: SchemaTypes.Mixed,
  })
  address: any;

  @Prop()
  slug: string;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
