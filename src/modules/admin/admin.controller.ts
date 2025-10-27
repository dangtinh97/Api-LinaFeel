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

@Controller('/admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Public()
  @Get('/login')
  @Render('admin/login')
  async login() {
    return {};
  }

  @Public()
  @Post('/login')
  async attemptLogin(@Res() res, @Req() { body }: Request) {
    const { username, password } = body as any;
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
  ) {
    const { order_id, key } = body;
    console.log(file, order_id, key);
  }
}
