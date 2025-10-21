import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import LogGemini from './schemas/log-gemini.schema';
import { Model } from 'mongoose';

@Injectable()
export class LogService {
  constructor(
    @InjectModel(LogGemini.name)
    private readonly logGeminiModel: Model<LogGemini>,
  ) {}

  async logGemini(data: any) {
    return await this.logGeminiModel.create(data);
  }
}
