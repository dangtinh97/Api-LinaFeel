import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Render,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from '../../decorators/public.decorator';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { AdminService } from './admin.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
import * as fs from 'fs';
import { KeyAppService } from '../key-app/key-app.service';
import { AppConfig } from '../../app.config';
import { ConfigService } from '@nestjs/config';

var md5 = require('md5');

@Controller('/admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly uploadService: UploadService,
    private readonly keyAppService: KeyAppService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('/login')
  @Render('admin/login')
  async login() {
    return {};
  }

  @Public()
  @Post('/login')
  async attemptLogin(@Res() res: any, @Req() { body }: Request) {
    const attempt = await this.adminService.attempt(body);
    if (!attempt) {
      return res.redirect('/admin/login');
    }
    res.cookie('jwt', attempt.token, {});
    return res.redirect('/admin/purchases');
  }

  @Public()
  @Get('/purchases')
  @Render('admin/purchase')
  async list() {
    return await this.adminService.listPurchase();
  }

  @Get('/order/:id')
  @Render('admin/order')
  async order(@Param('id') id: string) {
    return {
      order_id: id,
    };
  }

  @Post('sync-order')
  @UseInterceptors(FileInterceptor('file'))
  async syncOrder(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Res() res: any,
  ) {
    const { order_id, key } = body;
    const { paths, dir } = await this.uploadService.unzipFile(file);
    const filePath = paths[0];
    const filePPn = this.uploadService.convertToMulterFile(filePath);
    const keyMd5 = md5(key);
    const { url } = await this.uploadService.uploadFile(
      filePPn,
      `${new Date().getTime()}-${keyMd5}.ppn`,
      'picovoice',
    );
    await this.keyAppService.saveKey({
      order_id: order_id,
      gemini_key:
        this.configService.get<AppConfig['GEMINI_API_KEY']>('GEMINI_API_KEY'),
      picovoice_key: key,
      picovoice_file: url,
    });
    fs.rmSync(dir, { recursive: true, force: true });
    res.redirect('/admin/purchases');
  }
}
