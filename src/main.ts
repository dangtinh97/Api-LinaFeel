import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './app.config';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'log', 'error', 'warn'],
  });
  const logger = new Logger();
  const configService = app.get(ConfigService);
  const port = configService.get<AppConfig['APP_PORT']>('APP_PORT')!;
  app.enableCors();

  await app.listen(port);
  logger.log('App running port: ' + port);
}

bootstrap().catch((error) => console.log(error));
