import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin } from 'mongodb';
import { AdminSchema } from './schemas/admin.schema';
import { AdminService } from './admin.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeyAppModule } from '../key-app/key-app.module';
import {
  HistoryBilling,
  HistoryBillingSchema,
} from '../billing/schemas/history-billing.schema';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Admin.name,
        schema: AdminSchema,
      },
      {
        name: HistoryBilling.name,
        schema: HistoryBillingSchema,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          global: true,
          secret: configService.get<string>('JWT_SECRET')!,
          signOptions: { expiresIn: '1y' },
        };
      },
      inject: [ConfigService],
    }),
    KeyAppModule,
    UploadModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
