import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  exports: [GeminiService],
  providers: [GeminiService],
})
export class GeminiModule {}
