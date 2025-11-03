import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

export enum AppSettingKey{
  APP_VERSION = 'APP_VERSION',
  AWS = 'AWS',
  GEMINI_KEY_API = 'GEMINI_KEY_API',
  GEMINI_KEY_API_VIP = 'GEMINI_KEY_API_VIP',
}

@Schema({
  collection: 'configs',
})
export class AppSetting {

  @Prop()
  key: string;

  @Prop({
    type: SchemaTypes.Mixed,
  })
  data: any;
}

export const AppSettingSchema = SchemaFactory.createForClass(AppSetting);
