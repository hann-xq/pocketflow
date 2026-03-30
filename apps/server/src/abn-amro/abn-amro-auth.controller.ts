import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AbnAmroTokenService } from './abn-amro-token.service';

@ApiTags('ABN AMRO')
@Controller({ version: VERSION_NEUTRAL })
export class AbnAmroAuthController {
  constructor(private readonly abnAmroTokenService: AbnAmroTokenService) {}

  /**
   * Handle the OAuth2 callback from ABN AMRO.
   *
   * Exchanges the authorization code for an access token and stores it for the
   * user that initiated the flow. The state parameter is required to identify
   * that user.
   *
   * Note: ABN AMRO sandbox redirects to https://localhost/auth by default.
   * See README for details on how to work around this.
   */
  @Get('auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Handle ABN AMRO OAuth2 callback',
    description:
      'Exchanges the authorization code for an access token and stores it server-side. ' +
      'Called automatically by ABN AMRO after consent.',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Authorization code from ABN AMRO',
  })
  @ApiQuery({
    name: 'state',
    required: true,
    description: 'State nonce returned by ABN AMRO, used to identify the user',
  })
  @ApiNoContentResponse({ description: 'Authorization successful' })
  @ApiBadRequestResponse({
    description: 'Invalid or missing authorization code',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired state nonce',
  })
  async callback(@Query('code') code: string, @Query('state') state: string) {
    await this.abnAmroTokenService.handleCallback(code, state);
  }
}
