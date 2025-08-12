import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './schemes/message.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
  ) {}

  async getList(sessionOid: string) {
    const list = await this.messageModel
      .find({
        session_id: sessionOid,
      })
      .exec();
    if (list.length != 0 || !ObjectId.isValid(sessionOid)) {
      return list;
    }
  }

  async createMessage(userOid: string, sessionOid: string, message: string) {
    return await this.messageModel.create({
      message: message,
      session_id: sessionOid,
      user_oid: ObjectId.isValid(userOid) ? new ObjectId(userOid) : '',
    });
  }

  async postMessage(userOid: string, sessionOid: string, message: string) {
    await this.createMessage(userOid, sessionOid, message);
  }
}
