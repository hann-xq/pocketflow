import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../common/exceptions/domain.exception';
import { NotAuthorizedException } from '../common/exceptions/not-authorized.exception';
import { TransactionsService } from '../transactions/transactions.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { AbnAmroTokenResponse } from './dto/abn-amro-token.dto';
import {
  AbnAmroTransaction,
  AbnAmroTransactionsResponse,
} from './dto/abn-amro-transaction.dto';

@Injectable()
export class AbnAmroService {
  private readonly logger = new Logger(AbnAmroService.name);

  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private readonly authUrl: string;
  private readonly tokenUrl: string;
  private readonly apiUrl: string;
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly scope: string;
  private readonly apiKey: string;
  private readonly mtlsAgent: https.Agent | undefined;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
    private readonly transactionsService: TransactionsService,
    private readonly bankAccountsService: BankAccountsService,
  ) {
    this.authUrl = configService.get(
      'ABN_AMRO_AUTH_URL',
      'https://auth-sandbox.abnamro.com/as/authorization.oauth2',
    );
    this.tokenUrl = configService.get(
      'ABN_AMRO_TOKEN_URL',
      'https://auth-mtls-sandbox.abnamro.com/as/token.oauth2',
    );
    this.apiUrl = configService.get(
      'ABN_AMRO_API_URL',
      'https://api-sandbox.abnamro.com',
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
    this.apiKey = configService.get('ABN_AMRO_API_KEY', '');
    this.mtlsAgent = this.buildMtlsAgent(
      configService.get<string>('ABN_AMRO_CERT_PATH'),
      configService.get<string>('ABN_AMRO_KEY_PATH'),
    );

    const defaultToken = configService.get<string>('ABN_AMRO_ACCESS_TOKEN');
    if (defaultToken) {
      this.accessToken = defaultToken;
      this.tokenExpiry = new Date('9999-12-31');
      this.logger.log(
        'Using pre-configured ABN_AMRO_ACCESS_TOKEN from environment',
      );
    }
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<{ accessToken: string }> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
    });

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

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      this.logger.log('Access token obtained successfully');

      return { accessToken: this.accessToken };
    } catch (error: unknown) {
      throw this.unwrapTokenError(error);
    }
  }

  isAuthorized(): boolean {
    return !!(
      this.accessToken &&
      this.tokenExpiry &&
      this.tokenExpiry > new Date()
    );
  }

  private getStoredToken(): string {
    if (!this.isAuthorized()) {
      throw new NotAuthorizedException(
        'Not authorized. Visit GET /api/abn-amro/authorize to start the OAuth2 flow.',
      );
    }

    return this.accessToken!;
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

  private unwrapTokenError(error: unknown): Error {
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

      return new Error(
        `Token request failed: ${aggregate.errors.map((e: Error) => e.message).join('; ')}`,
      );
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  private async fetchTransactions(
    accessToken: string,
    accountNumber: string,
  ): Promise<AbnAmroTransaction[]> {
    const allTransactions: AbnAmroTransaction[] = [];
    let nextPageKey: string | null = null;

    do {
      const url = `${this.apiUrl}/v1/accounts/${accountNumber}/transactions`;
      const params: Record<string, string> = {};

      if (nextPageKey) {
        params['nextPageKey'] = nextPageKey;
      }

      try {
        const response = await lastValueFrom(
          this.httpService.get<AbnAmroTransactionsResponse>(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'API-Key': this.apiKey,
            },
            params,
          }),
        );

        allTransactions.push(...response.data.transactions);
        nextPageKey = response.data.nextPageKey;
      } catch {
        // Let the error fall through; it is possible that the ABN AMRO API is down or rejects our request.
        // However, we have to break out of the loop to prevent an infinite retry loop.
        break;
      }
    } while (nextPageKey);

    return allTransactions;
  }

  private mapToEntity(
    abnTransaction: AbnAmroTransaction,
    bankAccountId: string,
    categoryId?: string,
  ): Partial<Transaction> {
    return {
      description: abnTransaction.description ?? null,
      amount: abnTransaction.amount,
      date: abnTransaction.bookDate,
      counterpartyName: abnTransaction.counterPartyName ?? null,
      counterpartyAccount: abnTransaction.counterPartyAccountNumber ?? null,
      categoryId: categoryId ?? null,
      bankAccountId,
      tags: [],
    };
  }

  async syncTransactions(
    accountNumber?: string,
    userId?: string,
    categoryId?: string,
  ): Promise<{ imported: number; errors: string[] }> {
    if (!accountNumber) {
      return {
        imported: 0,
        errors: ['accountNumber query parameter is required'],
      };
    }

    if (!userId) {
      return {
        imported: 0,
        errors: ['userId query parameter is required'],
      };
    }

    const errors: string[] = [];

    try {
      const accessToken = this.getStoredToken();

      const bankAccount =
        await this.bankAccountsService.findOrCreateByAccountNumber(
          accountNumber,
          userId,
        );
      this.logger.log(
        `Using bank account ${bankAccount.id} for account number ${accountNumber}`,
      );

      this.logger.log(`Fetching transactions for account ${accountNumber}...`);
      const abnTransactions = await this.fetchTransactions(
        accessToken,
        accountNumber,
      );
      this.logger.log(`Received ${abnTransactions.length} transactions`);

      const entities = abnTransactions.map((t) =>
        this.mapToEntity(t, bankAccount.id, categoryId),
      );
      await this.transactionsService.bulkCreate(entities);

      return { imported: entities.length, errors };
    } catch (error: unknown) {
      if (error instanceof DomainException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';

      this.logger.error(`ABN AMRO sync failed: ${message}`);
      errors.push(message);

      return { imported: 0, errors };
    }
  }
}
