import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { AbnAmroService } from './abn-amro.service';

@Controller('abn-amro')
export class AbnAmroController {
  constructor(private readonly abnAmroService: AbnAmroService) {}

  /**
   * Initiate the ABN AMRO OAuth2 authorization code flow.
   *
   * This redirects the user to the ABN AMRO consent page.
   */
  @Get('authorize')
  @Redirect()
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
  @Get('callback')
  @HttpCode(HttpStatus.OK)
  async callback(@Query('code') code: string) {
    const { accessToken } = await this.abnAmroService.handleCallback(code);

    return {
      message: 'Authorization successful. You may now sync transactions.',
      accessToken,
    };
  }

  /**
   * Triggers a sync of transactions from the ABN AMRO API.
   *
   * This requires prior authorization via GET /api/abn-amro/authorize.
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
