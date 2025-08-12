import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './schemes/message.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { MoodService } from '../mood/mood.service';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
    private moodService: MoodService,
    private geminiService: GeminiService,
  ) {}

  async getList(sessionOid: string) {
    const list = await this.messageModel
      .find({
        session_id: sessionOid,
      })
      .exec();
    const findMood = await this.moodService.findMoodById(sessionOid);
    if (list.length != 0 || !ObjectId.isValid(sessionOid)) {
      return {
        mood: findMood ? findMood.key : '',
        list: list,
      };
    }
    if (!findMood) {
      return {
        mood: '',
        list: list,
      };
    }
    const messages = [];
    const messageDefault = this.defaultMessageByMood(findMood.key);
    messages.push(this.formatMessage(messageDefault, true));
    const messageBot = await this.geminiService.chat(messages);
    await this.createMessage('', sessionOid, messageBot);
    const dataMessage = await this.messageModel
      .find({
        session_id: sessionOid,
      })
      .exec();

    return {
      mood: findMood.key,
      list: dataMessage,
    };
  }

  async createMessage(userOid: string, sessionOid: string, message: string) {
    return await this.messageModel.create({
      message: message,
      session_id: sessionOid,
      user_oid: ObjectId.isValid(userOid) ? new ObjectId(userOid) : null,
    });
  }

  async postMessage(userOid: string, sessionOid: string, message: string) {
    await this.createMessage(userOid, sessionOid, message);
    const findMood = await this.moodService.findMoodById(sessionOid);
    const messages = [];
    if (findMood) {
      const defaultMessage = this.defaultMessageByMood(findMood.key);
      messages.push(this.formatMessage(defaultMessage, true));
    }
    const list = await this.messageModel.find({
      session_id: sessionOid,
    });

    if (list.length > 20) {
      return {
        message:
          'Mình nghĩ hôm nay chúng ta đã chia sẻ khá nhiều rồi, cảm ơn cậu đã tin tưởng.\n[Đã đạt giới hạn]',
        user_oid: null,
        session_id: sessionOid,
      };
    }

    const messagesFormat = list.map((item) => {
      return this.formatMessage(item.message, item.user_oid != null);
    });
    messages.push(...messagesFormat);
    const messageBot = await this.geminiService.chat(messages);
    return await this.createMessage('', sessionOid, messageBot);
  }

  defaultMessageByMood(mood: string) {
    const moods = {
      HAPPY: 'Hôm nay mình cảm thấy rất vui.',
      LOVE: 'Hôm nay mình cảm thấy rất thích thú.',
      SAD: 'Hôm nay mình cảm thấy buồn.',
      CONFUSED: 'Hôm nay mình cảm thấy bối rối.',
      ANGRY: 'Hôm nay mình cảm thấy rất bực mình.',
      SURPRISED: 'Vừa có chuyện bất ngờ xảy ra.',
    };
    return moods[mood.toLocaleUpperCase()] ?? '';
  }

  formatMessage(message: string, isUser: boolean) {
    return {
      role: isUser ? 'user' : 'model',
      parts: [
        {
          text: message,
        },
      ],
    };
  }
}
