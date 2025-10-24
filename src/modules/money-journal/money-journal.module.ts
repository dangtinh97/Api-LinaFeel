import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MoneyJournalSchema,
  MoneyJournal,
} from './schemas/money-journal.schema';
import { MoneyJournalService } from './money-journal.service';
import { MoneyJournalController } from './money-journal.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MoneyJournal.name,
        schema: MoneyJournalSchema,
      },
    ]),
  ],
  providers: [MoneyJournalService],
  exports: [MoneyJournalService],
  controllers:[MoneyJournalController],
})
export class MoneyJournalModule {}
