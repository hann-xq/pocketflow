import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Redirect,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { AbnAmroService } from './abn-amro.service';
import { AbnAmroCallbackResponseDto } from './dto/abn-amro-callback-response.dto';

@ApiTags('ABN AMRO')
@Controller({ version: VERSION_NEUTRAL })
export class AbnAmroAuthController {
  constructor(private readonly abnAmroService: AbnAmroService) {}

  /**
   * Initiate the ABN AMRO OAuth2 authorization code flow.
   *
   * This redirects the user to the ABN AMRO consent page.
   */
  @Get('abn-amro/authorize')
  @Redirect()
  @ApiOperation({
    summary: 'Initiate ABN AMRO OAuth2 authorization',
    description:
      'Redirects to the ABN AMRO consent page to start the OAuth2 authorization code flow.',
  })
  @ApiFoundResponse({ description: 'Redirect to ABN AMRO OAuth2 consent page' })
  authorize() {
    const url = this.abnAmroService.getAuthorizationUrl();
    return { url };
  }

  /**
   * Handle the OAuth2 callback from ABN AMRO.
   *
   * This exchanges the authorization code for an access token.
   *
   * Note: ABN AMRO sandbox redirects to https://localhost/auth by default.
   * See README for details on how to work around this.
   */
  @Get('auth')
  @HttpCode(HttpStatus.OK)
  @Serialize(AbnAmroCallbackResponseDto)
  @ApiOperation({
    summary: 'Handle ABN AMRO OAuth2 callback',
    description:
      'Exchanges the authorization code for an access token. Called automatically by ABN AMRO after consent.',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Authorization code from ABN AMRO',
  })
  @ApiOkResponse({ type: AbnAmroCallbackResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid or missing authorization code',
  })
  async callback(@Query('code') code: string) {
    const { accessToken } = await this.abnAmroService.handleCallback(code);
    return {
      message: 'Authorization successful. You may now sync transactions.',
      accessToken,
    };
  }
}
