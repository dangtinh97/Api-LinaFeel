import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { User } from '../../decorators/user.decorator';
import { JwtAuthGuard } from '../../guards/auth.guard';

@Controller('/chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get('/:id')
  async list(@Param('id') id: string) {
    return await this.service.getList(id);
  }

  @Post('/:id')
  async sendMessage(
    @User() { user_oid }: any,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const { message } = request.body as any;
    return await this.service.postMessage(user_oid, id, message);
  }
}
