import {
  BadRequestException,
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
   * Exchanges the authorization code for an access token, validates the
   * resulting consent (status, IBAN, and scopes), and stores the token and
   * consent expiry for the user that initiated the flow. The state parameter
   * is required to identify that user.
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
      'Should be called after consent or can be called by ABN AMRO (depends on configuration).',
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
    description: 'Missing authorization code or state parameter',
  })
  @ApiUnauthorizedResponse({
    description:
      'Invalid or expired state nonce; or consent validation failed ' +
      '(consent not fully signed, IBAN mismatch, or missing required scopes)',
  })
  async callback(@Query('code') code: string, @Query('state') state: string) {
    if (!code) {
      throw new BadRequestException('Missing authorization code.');
    }

    if (!state) {
      throw new BadRequestException('Missing state parameter.');
    }

    await this.abnAmroTokenService.handleCallback(code, state);
  }
}
