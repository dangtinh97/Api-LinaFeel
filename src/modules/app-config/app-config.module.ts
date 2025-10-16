import { Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AppSetting, AppSettingSchema } from './schemas/app-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AppSetting.name,
        schema: AppSettingSchema,
      },
    ]),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
