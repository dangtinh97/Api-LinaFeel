import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KeyApp, KeyAppSchema } from './schemas/key-app.schemas';
import { KeyAppService } from './key-app.service';
import { KeyAppController } from './key-app.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: KeyApp.name,
        schema: KeyAppSchema,
      },
    ]),
    UserModule,
  ],
  exports: [KeyAppService],
  providers: [KeyAppService],
  controllers: [KeyAppController],
})
export class KeyAppModule {}
