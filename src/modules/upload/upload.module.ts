import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [
    AppConfigModule
  ],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
