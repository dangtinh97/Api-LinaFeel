import { Document } from 'mongoose';
import { Prop, Schema } from '@nestjs/mongoose';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class BaseModel extends Document {
  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}
