import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Admin } from './schemas/admin.schema';
import { JwtService } from '@nestjs/jwt';
import { HistoryBilling } from '../billing/schemas/history-billing.schema';
import { KeyAppService } from '../key-app/key-app.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<Admin>,
    private jwtService: JwtService,
    @InjectModel(HistoryBilling.name)
    private readonly historyBillingModel: Model<HistoryBilling>,
    private readonly keyAppService: KeyAppService,
  ) {}

  async attempt({ username, password }: any) {
    const find = await this.adminModel.findOne({
      email: username,
    });
    if (!find) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, find.password);
    if (!isMatch) {
      return null;
    }
    const token = this.jwtService.sign({
      sub: find._id.toString(),
    });
    return {
      username: username,
      token: token,
    };
  }

  async listPurchase() {
    const orders = await this.historyBillingModel.aggregate([
      {
        $group: {
          _id: '$order_id',
        },
      },
    ]);
    const orderIds = orders.map((item) => item._id);
    const keys = await this.keyAppService.getAllByOrderIds(orderIds);
    const result = [];
    orderIds.forEach((orderId) => {
      const item = {};
      item['order_id'] = orderId;
      item['is_processed'] = !!keys.find((key) => key.order_id == orderId);
      item['is_used'] = item['is_processed']
        ? keys.find((key) => key.order_id == orderId).use
        : false;
      const active = keys.find((key) => key.order_id == orderId)?.active ?? null;
      item['color'] =
        active === true ? 'green' : active === false ? 'red' : 'inherit';

      result.push(item);
    });
    console.log(result);
    return result;
  }
}
