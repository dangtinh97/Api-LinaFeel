import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({
  collection: 'ai_agents',
})
export class AIAgent {
  @Prop({
    type: SchemaTypes.Mixed,
  })
  action_verb: any;

  @Prop({
    type: SchemaTypes.Mixed,
  })
  object_noun: any;

  @Prop({
    type: SchemaTypes.Mixed,
  })
  function_declarations: any;

  @Prop()
  key: string;

  @Prop()
  active: boolean;

  @Prop({ default: false })
  action_client: boolean;
}

export const AIAgentSchema = SchemaFactory.createForClass(AIAgent);
