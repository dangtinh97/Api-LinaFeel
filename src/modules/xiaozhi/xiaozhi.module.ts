import { Module } from '@nestjs/common';
import { XiaozhiService } from './xiaozhi.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [XiaozhiService],
  exports: [XiaozhiService],
})
export class XiaozhiModule {}