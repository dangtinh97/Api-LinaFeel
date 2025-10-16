import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { HttpModule } from '@nestjs/axios';
import { GeminiController } from './gemini.controller';

@Module({
  imports: [HttpModule],
  exports: [GeminiService],
  providers: [GeminiService],
  controllers: [GeminiController],
})
export class GeminiModule {}
