import { Controller, Get, Render } from '@nestjs/common';

@Controller('/public')
export class ViewController {
  @Get('tou')
  @Render('tou')
  tou() {
    return {};
  }

  @Get('/delete-account')
  @Render('delete-account')
  deleteAccount() {
    return {};
  }
}
