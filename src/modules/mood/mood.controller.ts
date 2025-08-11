import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { User } from '../../decorators/user.decorator';
import { MoodService } from './mood.service';

@Controller('/moods')
@UseGuards(JwtAuthGuard)
export class MoodController {
  constructor(private service: MoodService) {}

  @Post('/')
  async create(@User() { user_oid }: any, @Req() req: Request) {
    const { type } = req.body as any;
    return await this.service.addMood(user_oid, type);
  }
}
