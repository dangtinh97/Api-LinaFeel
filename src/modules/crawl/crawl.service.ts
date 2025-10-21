import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { NEWS } from '../../common/keyword';
import { convertXML } from 'simple-xml-to-json';
import * as _ from 'lodash';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { News } from './schemas/news.schema';
import { parse } from 'node-html-parser';
@Injectable()
export class CrawlService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(News.name)
    private readonly newsModel: Model<News>,
  ) {}
  async goldPrice() {
    const url =
      'http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v';
    const curl = await lastValueFrom(this.httpService.get(url));
    const dataXml = curl.data;
    const result = [];
    dataXml.DataList.Data.forEach((item: any) => {
      const id = item['@row'];
      if (['4', '7'].includes(id)) {
        result.push({
          name: item[`@n_${id}`].split(' (')[0],
          time: item[`@d_${id}`].split(' ')[1],
          buy: new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(item[`@pb_${id}`]),
          sell: new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(item[`@ps_${id}`]),
        });
      }
    });
    return this.formatGoldPrices(result);
  }
  formatGoldPrices(data: any) {
    let msg = `Cập nhật lần cuối lúc ${data[0].time} này hôm nay, giá vàng đang như sau\n`;
    for (const item of data) {
      msg += `${item.name}: mua ${item.buy}, bán ${item.sell}\n`;
    }
    msg += '\nGiá có thể thay đổi nhẹ trong ngày?';
    return msg.trim();
  }

  async crawlNews() {
    // await this.summaryNews({
    //   url: 'https://vnexpress.net/nguoi-lao-dong-khong-the-mua-nha-vi-gia-bat-dong-san-tang-qua-cao-4953886.html',
    //   id: '68f74106dd692646c8e59d5b',
    // });
    const add = [];
    for (const item of NEWS) {
      const curl = await lastValueFrom(this.httpService.get(item.link));
      const dataXML = curl.data.replace(
        /<description>([\s\S]*?)<\/description>/g,
        (match, inner) => {
          // Tìm phần text sau </br> hoặc sau ảnh
          const textMatch = inner.match(
            /<\/br>([^<]+?)(?:]]>|<\/description>|$)/,
          );
          if (textMatch) {
            // Lấy phần mô tả, trim khoảng trắng dư
            const cleanText = textMatch[1].trim();
            return `<description>${cleanText}</description>`;
          } else {
            return `<description></description>`;
          }
        },
      );
      const myJson = convertXML(dataXML);
      const jsonData = _.get(
        myJson,
        'rss.children.0.channel.children',
        [],
      ).filter((item: any) => item.item)[0]['item']['children'];

      const flatObj = jsonData.reduce((acc, item) => {
        const key = Object.keys(item)[0];
        const value = item[key];
        acc[key] = value.content ?? value; // nếu có content thì lấy content, không thì giữ nguyên object
        return acc;
      }, {});
      try {
        const create = await this.newsModel.create({
          title: _.get(flatObj, 'title', ''),
          description: _.get(flatObj, 'description', ''),
          url: _.get(flatObj, 'link', ''),
          published_at: new Date(_.get(flatObj, 'pubDate', '')),
          category: item.category,
        });
        add.push({
          id: create._id.toString(),
          url: _.get(flatObj, 'link', ''),
        });
      } catch (e) {}
    }
    // const run = add.map((item) => this.summaryNews(item));
    // Promise.all(run);
    return add;
  }

  async summaryNews({ id, url }) {
    const curl = await lastValueFrom(this.httpService.get(url));
    const html = curl.data;
    const root = parse(html);
    const elements = root.querySelector('article.fck_detail');
    for (let i = 0; i < elements.childNodes.length; i++) {
      if (elements.childNodes[i].rawTagName !== 'p') {
        continue;
      }
    }
  }

  async getRandomNews(category: string) {
    const categories = NEWS.map((item) => item.category);
    if (!categories.includes(category)) {
      category = categories[Math.floor(Math.random() * categories.length)];
    }
    const news = await this.newsModel
      .find({
        category: category,
      })
      .sort({ _id: -1 })
      .limit(10)
      .exec();
    return news[Math.floor(Math.random() * news.length)];
  }
}
