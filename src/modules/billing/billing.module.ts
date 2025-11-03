import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { KeyAppModule } from '../key-app/key-app.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HistoryBilling,
  HistoryBillingSchema,
} from './schemas/history-billing.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: HistoryBilling.name,
        schema: HistoryBillingSchema,
      },
    ]),
    KeyAppModule,
    UserModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [],
})
export class BillingModule {}
