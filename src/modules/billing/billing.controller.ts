import { Controller, Post, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { UserService } from '../user/user.service';
import { payloadFromToken } from '../../common';

@Controller('/billing')
export class BillingController {
  constructor(
    private billingService: BillingService,
    private userService: UserService,
  ) {}

  @Post('/verify-purchase')
  async verifyPurchase(@Req() { body, headers }: any) {
    const verify = await this.billingService.verifyPurchase(
      body.purchase_token,
    );
    const { authorization } = headers;
    const payload = payloadFromToken(authorization);
    if (verify.valid && payload.sub && verify.order_id) {
      await this.userService.updateTime(payload.sub, verify.order_id);
    }
    return verify;
  }
}
