import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { User } from '../../decorators/user.decorator';
import { JournalService } from './journal.service';

@Controller('journals')
@UseGuards(JwtAuthGuard)
export class JournalController {
  constructor(private service: JournalService) {}

  @Post('/')
  async create(@User() { user_oid }: any, @Req() req: Request) {
    const { content } = req.body as any;
    return await this.service.create(user_oid, content);
  }

  @Get('/')
  async list(@User() { user_oid }: any) {
    return await this.service.list(user_oid);
  }

  @Post('/{id}')
  async update(
    @Param('id') id: string,
    @User() { user_oid }: any,
    @Req() req: Request,
  ) {
    const { content } = req.body as any;
    return await this.service.update(id, content);
  }
}
