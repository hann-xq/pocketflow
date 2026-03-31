import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { AbnAmroService } from './abn-amro.service';
import { AbnAmroTokenService } from './abn-amro-token.service';
import { AbnAmroAuthorizationResponseDto } from './dto/abn-amro-authorization-response.dto';
import { AbnAmroSyncResponseDto } from './dto/abn-amro-sync-response.dto';

@ApiTags('ABN AMRO')
@Auth()
@Controller('bank-accounts/:id/abn-amro')
export class AbnAmroController {
  constructor(
    private readonly abnAmroService: AbnAmroService,
    private readonly abnAmroTokenService: AbnAmroTokenService,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  /**
   * Return the ABN AMRO OAuth2 authorization URL for the given bank account.
   *
   * The client should open this URL in a browser or in-app browser to initiate
   * the consent flow. After consent, ABN AMRO will redirect to the configured
   * redirect URI with a code and state parameter, which is handled by GET /auth.
   */
  @Get('authorization')
  @HttpCode(HttpStatus.OK)
  @Serialize(AbnAmroAuthorizationResponseDto)
  @ApiOperation({
    summary: 'Get ABN AMRO OAuth2 authorization URL',
    description:
      'Returns the authorization URL the client should open to start the OAuth2 consent flow.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Bank account ID' })
  @ApiOkResponse({ type: AbnAmroAuthorizationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Bank account belongs to another user' })
  @ApiNotFoundResponse({ description: 'Bank account not found' })
  async getAuthorizationUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const bankAccount = await this.bankAccountsService.findOne(id);

    if (bankAccount.userId !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to access this bank account',
      );
    }

    return {
      authorizationUrl: this.abnAmroTokenService.getAuthorizationUrl(id),
    };
  }

  /**
   * Import transactions from ABN AMRO into the given bank account.
   *
   * Requires prior authorization. Duplicate transactions are skipped automatically.
   */
  @Post('transactions')
  @HttpCode(HttpStatus.OK)
  @Serialize(AbnAmroSyncResponseDto)
  @ApiOperation({
    summary: 'Import transactions from ABN AMRO',
    description:
      'Fetches and imports transactions from ABN AMRO for the given bank account. ' +
      'Requires prior authorization via GET /api/v1/bank-accounts/:id/abn-amro/authorization. ' +
      'Duplicate transactions are skipped automatically.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Bank account ID' })
  @ApiOkResponse({ type: AbnAmroSyncResponseDto })
  @ApiUnauthorizedResponse({
    description:
      'Missing or invalid JWT token, or no ABN AMRO token found for this bank account',
  })
  @ApiForbiddenResponse({ description: 'Bank account belongs to another user' })
  @ApiNotFoundResponse({ description: 'Bank account not found' })
  async sync(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const bankAccount = await this.bankAccountsService.findOne(id);

    if (bankAccount.userId !== user.id && !user.isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to access this bank account',
      );
    }

    return this.abnAmroService.syncTransactions(bankAccount.id);
  }

  /**
   * Remove the stored ABN AMRO OAuth2 connection for the given bank account.
   *
   * After removal, the user must re-authorize to sync transactions again.
   */
  @Delete('connection')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove the ABN AMRO bank connection',
    description:
      'Removes the stored ABN AMRO OAuth2 connection for the given bank account. ' +
      'Re-authorize via GET /api/v1/bank-accounts/:id/abn-amro/authorization to reconnect.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Bank account ID' })
  @ApiNoContentResponse({ description: 'Connection removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Bank account belongs to another user' })
  @ApiNotFoundResponse({ description: 'Bank account not found' })
  async deleteConnection(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    const bankAccount = await this.bankAccountsService.findOne(id);

    if (bankAccount.userId !== user.id && !user.isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to access this bank account',
      );
    }

    await this.abnAmroTokenService.deleteConnection(bankAccount.id);
  }
}
