import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KeyApp, KeyAppSchema } from './schemas/key-app.schemas';
import { KeyAppService } from './key-app.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: KeyApp.name,
        schema: KeyAppSchema,
      },
    ]),
  ],
  exports: [KeyAppService],
  providers: [KeyAppService],
  controllers: [],
})
export class KeyAppModule {}
