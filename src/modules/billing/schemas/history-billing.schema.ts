import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
@Schema({
  collection: 'history_billing',
})
export class HistoryBilling {
  @Prop()
  order_id: string;
  @Prop({
    type: SchemaTypes.Mixed,
  })
  data: any;

  @Prop()
  use: boolean;
}

export const HistoryBillingSchema =
  SchemaFactory.createForClass(HistoryBilling);
