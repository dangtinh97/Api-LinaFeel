import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MongooseModule } from "@nestjs/mongoose";
import { Message, MessageSchema } from "./schemes/message.schema";
import { GeminiModule } from "../gemini/gemini.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Message.name,
        schema: MessageSchema,
      }
    ]),
    GeminiModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
