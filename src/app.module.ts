import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfig } from './app.config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { timestampsPlugin } from './shared/plugins/timestamps.plugin';
import { AuthModule } from './modules/auth/auth.module';
import { JwtStrategy } from './jwt-strategy/jwt-strategy.service';
import { ViewModule } from './modules/view/view.module';
import { AppConfigModule } from './modules/app-config/app-config.module';
import { BillingModule } from './modules/billing/billing.module';
import { GeminiModule } from './modules/gemini/gemini.module';
import { CrawlModule } from './modules/crawl/crawl.module';
import { MoneyJournalModule } from './modules/money-journal/money-journal.module';
import { AdminModule } from './modules/admin/admin.module';
import { KeyAppModule } from './modules/key-app/key-app.module';
import { EdgeTtsModule } from './modules/edge-tts/edge-tts.module';
import { MarketingModule } from './modules/marketing/marketing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get<AppConfig['MONGODB_URI']>('MONGODB_URI'),
          autoCreate: true,
          autoIndex: true,
          connectionFactory: (connection: any) => {
            connection.plugin(timestampsPlugin);
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    ViewModule,
    AppConfigModule,
    BillingModule,
    GeminiModule,
    CrawlModule,
    MoneyJournalModule,
    AdminModule,
    KeyAppModule,
    EdgeTtsModule,
    MarketingModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtService, JwtStrategy, ConfigService],
})
export class AppModule {}
