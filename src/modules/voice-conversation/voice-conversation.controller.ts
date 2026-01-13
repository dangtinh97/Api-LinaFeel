import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { User } from '../../decorators/user.decorator';
import { VoiceConversationService } from './voice-conversation.service';

@Controller('/voice-conversation')
@UseGuards(JwtAuthGuard)
export class VoiceConversationController {
  constructor(private service: VoiceConversationService) {}

  @Post('/')
  async smartVoice(
    @User() { user_oid }: any,
    @Req() req: Request,
  ): Promise<any> {
    console.log(user_oid);
    const { message, session_id, name, personality } = req.body as any;
    return await this.service.smartConversation({
      user_oid,
      session_id,
      message,
      name,
      personality,
    });
  }
}
