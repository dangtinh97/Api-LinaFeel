import { Module } from '@nestjs/common';
import { EdgeTtsController } from './edge-tts.controller';

@Module({
  imports: [],
  exports: [],
  providers: [],
  controllers:[EdgeTtsController],
})
export class EdgeTtsModule {}
