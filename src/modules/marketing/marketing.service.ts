import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AppConfig } from '../../app.config';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { MarketingContent } from './schemas/marketing-content.schema';
import { Model } from 'mongoose';
import { sleep, uuidv4 } from '../../common';
import { AppConfigService } from '../app-config/app-config.service';
import * as _ from 'lodash';
import * as dayjs from 'dayjs';

@Injectable()
export class MarketingService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(MarketingContent.name)
    private readonly marketingContentModel: Model<MarketingContent>,
    private appConfigService: AppConfigService,
  ) {}

  async aiSupport({ question, session_id }) {
    if (!session_id) {
      session_id = uuidv4();
    }
    if (question.trim() == '') {
      return {
        status: 200,
        text: 'Xin chào anh / chị, em có thể hỗ trợ gì cho anh / chị được ạ.',
        session_id: session_id,
      };
    }
    await this.marketingContentModel.create({
      session_id: session_id,
      content: question,
      role: 'user',
      type: 'text',
    });
    const allData: any = await this.marketingContentModel.find({
      session_id: session_id,
    });

    const [tools, system_instruction, marketingData] = await Promise.all([
      this.appConfigService.getByKeyConfig('MARKETING_TOOL'),
      this.appConfigService.getByKeyConfig('MARKETING_SYSTEM_INSTRUCTION'),
      this.appConfigService.getByKeyConfig('MARKETING_DATA'),
    ]);

    const contents = allData.map((item) => {
      let maping: any = {
        role: item.role,
      };
      if (item.type == 'text') {
        maping['parts'] = {
          text: item.content,
        };
      }
      if (item.type == 'function_call') {
        maping['parts'] = [item.content];
      }
      return maping;
    });
    contents.push({
      role: 'function',
      parts: [
        {
          functionResponse: {
            name: 'inventory_lookup',
            response: {
              data: JSON.stringify(marketingData, null, 2),
            },
          },
        },
      ],
    });
    const data = {
      contents,
      tools: tools,
      system_instruction: system_instruction,
    };
    const curl = await this.curlGemini(data);
    if (curl.text) {
      await this.marketingContentModel.create({
        session_id: session_id,
        content: (curl.text ?? '')
          .replaceAll('*','')
          .replaceAll('\n', ''),
        role: 'model',
        type: 'text',
      });
      return {
        session_id,
        status: 200,
        text: curl.text,
      };
    }
    if (curl.functionCall) {
      if (curl.functionCall.name === 'order_product') {
        this.sendNotification(curl.functionCall.args, 0).then();
        return {
          session_id,
          status: 201,
          text: 'Cảm ơn anh/ chị đã mua hàng bên em',
        };
      }
      await this.marketingContentModel.create({
        session_id: session_id,
        content: curl.functionCall,
        role: 'model',
        type: 'function_call',
      });
    }
    return {
      status: 400,
      text: 'Em chưa nghe rõ anh / chị nói, anh / chị nói rõ hơn giúp em được không ạ?',
      session_id: session_id,
    };
  }

  async curlGemini(data: any) {
    const apiKey =
      await this.appConfigService.getByKeyConfig('GEMINI_KEY_API_VIP');
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    try {
      const curl = await lastValueFrom(
        this.httpService.post(
          url,
          { ...data },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': apiKey,
            },
          },
        ),
      );
      const text = _.get(curl.data, 'candidates.0.content.parts.0.text', null);
      const functionCall = _.get(
        curl.data,
        'candidates.0.content.parts.0.functionCall',
        null,
      );
      if (text) {
        return { text };
      }
      if (functionCall) {
        return { functionCall };
      }
      return curl.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async sendNotification(infoBill: any, retry = 0) {
    try {
      if (retry >= 5) {
        return;
      }
      const token = '8211532200:AAGMApFf36joW71hRLuSfOFHdooIK6xC5rY';
      const time = dayjs(new Date())
        .add(7, 'hours')
        .format('HH:mm DD/MM/YYYY')
        .toString();
      const body = `Thông tin đơn hàng:\nĐơn hàng được tạo lúc: ${time}\nSản phẩm:\n${infoBill.product_name}, size: ${infoBill.product_size}, màu: ${infoBill.product_color}, số lượng:${infoBill.quantity}\nKhách hàng:\n${infoBill.customer_name} - ${infoBill.phone_number} - ${infoBill.shipping_address}`;
      const url = `https://api.telegram.org/bot${token}/sendMessage?text=${encodeURI(body)}&chat_id=-1003491650167&parse_mode=Markdown`;
      console.log(url);
      const curl = await lastValueFrom(
        this.httpService.post(url, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
      return curl.data;
    } catch (e) {
      await sleep(1000);
      this.sendNotification(infoBill, retry + 1).then();
    }
  }
}
