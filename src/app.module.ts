import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfig } from './app.config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { timestampsPlugin } from './shared/plugins/timestamps.plugin';
import { AuthModule } from './modules/auth/auth.module';
import { MoodModule } from './modules/mood/mood.module';
import { JwtStrategy } from './jwt-strategy/jwt-strategy.service';
import { ChatModule } from './modules/chat/chat.module';
import { JournalModule } from "./modules/jounral/journal.module";
import { ViewModule } from "./modules/view/view.module";
import { AppConfigModule } from './modules/app-config/app-config.module';
import { BillingModule } from './modules/billing/billing.module';
import { KeyAppModule } from './modules/key-app/key-app.module';
import { GeminiModule } from './modules/gemini/gemini.module';
import { CrawlModule } from './modules/crawl/crawl.module';

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
    MoodModule,
    ChatModule,
    JournalModule,
    ViewModule,
    AppConfigModule,
    BillingModule,
    GeminiModule,
    CrawlModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtService, JwtStrategy, ConfigService],
})
export class AppModule {}
