import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './app.config';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { UnauthorizedExceptionFilter } from './exception-filter/UnauthorizedExceptionFilter';
import { NotFoundExceptionFilter } from './exception-filter/NotFoundExceptionFilter';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['debug', 'log', 'error', 'warn'],
  });
  const logger = new Logger();
  const configService = app.get(ConfigService);
  const port = configService.get<AppConfig['APP_PORT']>('APP_PORT')!;
  app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
  app.useGlobalFilters(new UnauthorizedExceptionFilter());
  app.useGlobalFilters(new NotFoundExceptionFilter());
  app.enableCors();
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.setBaseViewsDir(join(__dirname, '..', 'views')); // Thư mục chứa file HTML
  app.setViewEngine('hbs'); // Sử dụng Handlebars
  app.use(cookieParser());
  await app.listen(port);
  logger.log('App running port: ' + port);
}

bootstrap().catch((error) => console.log(error));
