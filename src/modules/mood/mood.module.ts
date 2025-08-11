import { Module } from '@nestjs/common';
import { MoodService } from './mood.service';
import { MoodController } from './mood.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Mood, MoodSchema } from './schemas/mood.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Mood.name,
        schema: MoodSchema,
      },
    ]),
  ],
  controllers: [MoodController],
  providers: [MoodService],
})
export class MoodModule {}
