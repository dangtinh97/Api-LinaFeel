import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  collection: 'key_app',
})
export class KeyApp {
  @Prop()
  picovoice_key: string;

  @Prop()
  picovoice_file: string;

  @Prop()
  gemini_key: string;

  @Prop()
  order_id: string;
}

export const KeyAppSchema = SchemaFactory.createForClass(KeyApp);
