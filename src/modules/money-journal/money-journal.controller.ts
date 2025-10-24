import { Controller, Get, UseGuards } from '@nestjs/common';
import { MoneyJournalService } from './money-journal.service';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { User } from '../../decorators/user.decorator';
@Controller('/money-journals')
@UseGuards(JwtAuthGuard)
export class MoneyJournalController {
  constructor(private readonly moneyJournalService: MoneyJournalService) {}

  @Get('/')
  async list(
    @User() { user_oid }: any,
  ) {
    return await this.moneyJournalService.list();
  }
}
