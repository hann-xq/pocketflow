import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { InvalidRequestException } from '../common/exceptions/invalid-request.exception';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { AbnAmroService } from './abn-amro.service';
import { AbnAmroAuthorizationUrlResponseDto } from './dto/abn-amro-authorization-url-response.dto';
import { AbnAmroSyncResponseDto } from './dto/abn-amro-sync-response.dto';

@ApiTags('ABN AMRO')
@Controller('abn-amro')
export class AbnAmroController {
  constructor(private readonly abnAmroService: AbnAmroService) {}

  /**
   * Return the ABN AMRO OAuth2 authorization URL for the authenticated user.
   *
   * The client should open this URL in a browser or in-app browser to initiate
   * the consent flow. After consent, ABN AMRO will redirect to the configured
   * redirect URI with a code and state parameter, which is handled by GET /auth.
   */
  @Get('authorization-url')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @Serialize(AbnAmroAuthorizationUrlResponseDto)
  @ApiOperation({
    summary: 'Get ABN AMRO OAuth2 authorization URL',
    description:
      'Returns the authorization URL the client should open to start the OAuth2 consent flow.',
  })
  @ApiQuery({
    name: 'accountNumber',
    required: true,
    description: 'Dutch IBAN account number to authorize',
  })
  @ApiOkResponse({ type: AbnAmroAuthorizationUrlResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async getAuthorizationUrl(
    @CurrentUser() user: User,
    @Query('accountNumber') accountNumber?: string,
  ) {
    if (!accountNumber) {
      throw new InvalidRequestException(
        'accountNumber query parameter is required',
      );
    }

    return {
      authorizationUrl: await this.abnAmroService.getAuthorizationUrl(
        user.id,
        accountNumber,
      ),
    };
  }

  /**
   * Trigger a sync of transactions from ABN AMRO for the authenticated user.
   *
   * Requires prior authorization via GET /api/v1/abn-amro/authorization-url.
   */
  @Post('sync')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @Serialize(AbnAmroSyncResponseDto)
  @ApiOperation({
    summary: 'Sync transactions from ABN AMRO',
    description:
      'Fetches and imports transactions from ABN AMRO for the authenticated user. ' +
      'Requires prior authorization via GET /api/v1/abn-amro/authorization-url. ' +
      'Duplicate transactions are skipped automatically.',
  })
  @ApiQuery({
    name: 'accountNumber',
    required: true,
    description: 'Dutch IBAN account number to sync',
  })
  @ApiOkResponse({ type: AbnAmroSyncResponseDto })
  @ApiUnauthorizedResponse({
    description:
      'Missing or invalid JWT token, or no ABN AMRO token found for this user',
  })
  sync(
    @CurrentUser() user: User,
    @Query('accountNumber') accountNumber?: string,
  ) {
    if (!accountNumber) {
      throw new InvalidRequestException(
        'accountNumber query parameter is required',
      );
    }

    return this.abnAmroService.syncTransactions(accountNumber, user.id);
  }
}
