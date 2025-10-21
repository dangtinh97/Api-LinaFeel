import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import LogGemini, { LogGeminiSchema } from './schemas/log-gemini.schema';
import { LogService } from './log.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: LogGemini.name,
        schema: LogGeminiSchema,
      },
    ]),
  ],
  exports: [LogService],
  providers: [LogService],
})
export class LogModule {}
