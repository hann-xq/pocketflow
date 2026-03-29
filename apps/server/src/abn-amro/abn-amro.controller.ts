import { Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { AbnAmroService } from './abn-amro.service';
import { AbnAmroSyncResponseDto } from './dto/abn-amro-sync-response.dto';

@ApiTags('ABN AMRO')
@Serialize(AbnAmroSyncResponseDto)
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
  @ApiOperation({
    summary: 'Sync transactions from ABN AMRO',
    description:
      'Fetches and imports transactions from ABN AMRO. Requires prior authorization via GET /abn-amro/authorize.',
  })
  @ApiQuery({
    name: 'accountNumber',
    required: false,
    description: 'Dutch IBAN account number to sync',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    format: 'uuid',
    description: 'ID of the user to associate transactions with',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    format: 'uuid',
    description: 'Category to assign to all imported transactions',
  })
  @ApiOkResponse({ type: AbnAmroSyncResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Not authorized — visit GET /abn-amro/authorize first',
  })
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
