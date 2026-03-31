import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { isAxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalServiceException } from '../common/exceptions/external-service.exception';
import { NotAuthorizedException } from '../common/exceptions/not-authorized.exception';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { ExternalConnectionType } from '../bank-accounts/enums/external-connection-type.enum';
import { BankConnection } from './entities/bank-connection.entity';
import { AbnAmroTokenResponse } from './dto/abn-amro-token.dto';

/**
 * How long a pending OAuth2 state remains valid.
 *
 * TODO: In-memory state is lost on server restart and is not shared between
 * instances. Replace this map with a shared store (e.g. Redis) if that matters.
 */
const STATE_TTL_MS = 10 * 60 * 1000;

/**
 * Manages the ABN AMRO OAuth2 lifecycle: authorization URL generation,
 * authorization code exchange, token refresh, and BankConnection storage.
 */
@Injectable()
export class AbnAmroTokenService {
  private readonly logger = new Logger(AbnAmroTokenService.name);

  /**
   * Short-lived in-memory map that associates an OAuth2 state nonce with the
   * user who initiated the flow. Entries expire after STATE_TTL_MS.
   */
  private readonly pendingStates = new Map<
    string,
    { userId: string; bankAccountId: string; createdAt: Date }
  >();

  private readonly authUrl: string;
  private readonly tokenUrl: string;
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly scope: string;
  private readonly mtlsAgent: https.Agent | undefined;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
    private readonly bankAccountsService: BankAccountsService,
    @InjectRepository(BankConnection)
    private readonly connectionRepository: Repository<BankConnection>,
  ) {
    this.authUrl = configService.get(
      'ABN_AMRO_AUTH_URL',
      'https://auth-sandbox.abnamro.com/as/authorization.oauth2',
    );
    this.tokenUrl = configService.get(
      'ABN_AMRO_TOKEN_URL',
      'https://auth-mtls-sandbox.abnamro.com/as/token.oauth2',
    );
    this.clientId = configService.get('ABN_AMRO_CLIENT_ID', 'TPP_test');
    this.redirectUri = configService.get(
      'ABN_AMRO_REDIRECT_URI',
      'https://localhost/auth',
    );
    this.scope = configService.get(
      'ABN_AMRO_SCOPE',
      'psd2:account:transaction:read',
    );

    this.mtlsAgent = this.buildMtlsAgent(
      configService.get<string>('ABN_AMRO_CERT_PATH'),
      configService.get<string>('ABN_AMRO_KEY_PATH'),
    );
  }

  async getAuthorizationUrl(
    userId: string,
    accountNumber: string,
  ): Promise<string> {
    const bankAccount =
      await this.bankAccountsService.findOrCreateByAccountNumber(
        accountNumber,
        userId,
      );

    const state = crypto.randomBytes(16).toString('hex');
    this.pendingStates.set(state, {
      userId,
      bankAccountId: bankAccount.id,
      createdAt: new Date(),
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state,
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const pending = this.pendingStates.get(state);
    this.pendingStates.delete(state);

    if (!pending || Date.now() - pending.createdAt.getTime() > STATE_TTL_MS) {
      throw new NotAuthorizedException(
        'Invalid or expired OAuth2 state. Please restart the authorization flow.',
      );
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
    });

    this.logger.log(
      `Exchanging authorization code for bank account ${pending.bankAccountId}...`,
    );

    try {
      const response = await lastValueFrom(
        this.httpService.post<AbnAmroTokenResponse>(
          this.tokenUrl,
          params.toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: this.mtlsAgent,
          },
        ),
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      await this.saveToken(
        pending.bankAccountId,
        access_token,
        refresh_token ?? null,
        expiresAt,
      );

      this.logger.log(
        `Access token stored for bank account ${pending.bankAccountId}`,
      );
    } catch (error: unknown) {
      this.logger.error('Token exchange failed.');
      throw this.unwrapTokenError(error);
    }
  }

  async getConnectionForBankAccount(
    bankAccountId: string,
  ): Promise<BankConnection> {
    const record = await this.connectionRepository.findOneBy({ bankAccountId });

    if (!record) {
      throw new NotAuthorizedException(
        'No ABN AMRO connection found for this bank account.',
      );
    }

    return record;
  }

  async refreshAccessToken(connection: BankConnection): Promise<string> {
    if (!connection.refreshToken) {
      await this.connectionRepository.delete({
        bankAccountId: connection.bankAccountId,
      });

      throw new NotAuthorizedException(
        'ABN AMRO access token is expired and no refresh token is available.',
      );
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refreshToken,
      client_id: this.clientId,
    });

    this.logger.log(
      `Refreshing access token for bank account ${connection.bankAccountId}...`,
    );

    try {
      const response = await lastValueFrom(
        this.httpService.post<AbnAmroTokenResponse>(
          this.tokenUrl,
          params.toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: this.mtlsAgent,
          },
        ),
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Keep the existing refresh token if the response omits a new one.
      await this.saveToken(
        connection.bankAccountId,
        access_token,
        refresh_token ?? connection.refreshToken,
        expiresAt,
      );

      this.logger.log(
        `Access token refreshed for bank account ${connection.bankAccountId}`,
      );

      return access_token;
    } catch (error: unknown) {
      // A 400 or 401 from the token endpoint means the refresh token is
      // rejected. Remove the connection so the user is prompted to
      // re-authorize via the full OAuth2 flow.
      if (
        isAxiosError(error) &&
        error.response?.status !== undefined &&
        [400, 401].includes(error.response.status)
      ) {
        await this.connectionRepository.delete({
          bankAccountId: connection.bankAccountId,
        });

        this.logger.warn(
          `Refresh token rejected for bank account ${connection.bankAccountId}; connection removed.`,
        );

        throw new NotAuthorizedException(
          'ABN AMRO refresh token is invalid or expired',
        );
      }

      this.logger.error('Token refresh failed.');
      throw this.unwrapTokenError(error);
    }
  }

  async deleteConnection(bankAccountId: string): Promise<void> {
    await this.connectionRepository.delete({ bankAccountId });
  }

  private async saveToken(
    bankAccountId: string,
    plainAccessToken: string,
    plainRefreshToken: string | null,
    expiresAt: Date,
  ): Promise<void> {
    await this.connectionRepository.upsert(
      {
        bankAccountId,
        type: ExternalConnectionType.AbnAmro,
        accessToken: plainAccessToken,
        refreshToken: plainRefreshToken,
        expiresAt,
      },
      ['bankAccountId'],
    );
  }

  private buildMtlsAgent(
    certPath: string | undefined,
    keyPath: string | undefined,
  ): https.Agent | undefined {
    if (!certPath || !keyPath) {
      this.logger.warn(
        'ABN_AMRO_CERT_PATH / ABN_AMRO_KEY_PATH are not set; connecting without a client certificate. ' +
          'The token endpoint requires mTLS; the request will likely be rejected.',
      );
      return undefined;
    }

    try {
      const agent = new https.Agent({
        cert: fs.readFileSync(path.resolve(certPath)),
        key: fs.readFileSync(path.resolve(keyPath)),
      });

      this.logger.log(
        `mTLS certificate loaded (cert: ${certPath}, key: ${keyPath})`,
      );

      return agent;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to load mTLS certificate: ${message}`);
      throw error;
    }
  }

  private unwrapTokenError(error: unknown): ExternalServiceException {
    const aggregate =
      error instanceof AggregateError
        ? error
        : error instanceof Error && error.cause instanceof AggregateError
          ? error.cause
          : null;

    if (aggregate) {
      aggregate.errors.forEach((e: Error, i: number) =>
        this.logger.error(`Token request error [${i}]: ${e.message}`),
      );
    } else {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Token request error: ${message}`);
    }

    return new ExternalServiceException('Token request failed.');
  }
}
