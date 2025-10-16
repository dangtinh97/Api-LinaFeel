import { Controller, Module, Post, Req } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('/billing')
export class BillingController {
  constructor (
    private billingService:BillingService
  ) {}
  
  @Post('/verify-purchase')
  async verifyPurchase(@Req() {body}:any){
    return await this.billingService.verifyPurchase(body.purchase_token);
  }
}
