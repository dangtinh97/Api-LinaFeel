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

  @Prop({ default: false })
  use: boolean;
  @Prop({ default: null })
  active: boolean;

  @Prop()
  time_last_check: Date;
  
  @Prop()
  email: string;
}

export const KeyAppSchema = SchemaFactory.createForClass(KeyApp);
