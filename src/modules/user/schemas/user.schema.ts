import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseModel } from "../../../shared/schemas/base.model";

@Schema({
  collection: "users"
})
export class User extends BaseModel {
  @Prop()
  token_fcm: string;
  
  @Prop({ unique: true })
  username: string;
  
  @Prop()
  login_last: string;
  
  @Prop()
  uid_device: string;
  
  @Prop()
  language: string;
  
  @Prop()
  app_version: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
