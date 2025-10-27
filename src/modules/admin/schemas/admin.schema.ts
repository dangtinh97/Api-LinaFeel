import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseModel } from '../../../shared/schemas/base.model';

@Schema({
  collection: 'admins',
})
export class Admin extends BaseModel {
  @Prop()
  email: string;

  @Prop()
  password: string;
}
export const AdminSchema = SchemaFactory.createForClass(Admin);
