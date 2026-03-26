import { Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { AbnAmroService } from './abn-amro.service';

@Controller('abn-amro')
export class AbnAmroController {
  constructor(private readonly abnAmroService: AbnAmroService) {}

  /**
   * Triggers a sync of transactions from the ABN AMRO API.
   *
   * This requires prior authorization via GET /abn-amro/authorize.
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  sync(
    @Query('accountNumber') accountNumber?: string,
    @Query('userId') userId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.abnAmroService.syncTransactions(
      accountNumber,
      userId,
      categoryId,
    );
  }
}
