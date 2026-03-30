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
import { TransactionsService } from '../transactions/transactions.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { BankConnection } from './entities/bank-connection.entity';
import { AbnAmroTokenResponse } from './dto/abn-amro-token.dto';
import {
  AbnAmroTransaction,
  AbnAmroTransactionsResponse,
} from './dto/abn-amro-transaction.dto';

/**
 * How long a pending OAuth2 state remains valid. Ten minutes is the conventional
 * window used across OAuth2 implementations; generous enough for a user to
 * complete the consent flow while short enough to limit the exposure window.
 *
 * TODO: In-memory state is lost on server restart and is not shared between
 * instances. Replace this map with a shared store (e.g. Redis) if that matters.
 */
const STATE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AbnAmroService {
  private readonly logger = new Logger(AbnAmroService.name);

  /**
   * Short-lived in-memory map used to associate OAuth2 state with the user that
   * initiated the authorization flow. Entries expire after STATE_TTL_MS.
   */
  private readonly pendingStates = new Map<
    string,
    { userId: string; bankAccountId: string; createdAt: Date }
  >();

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
    @InjectRepository(BankConnection)
    private readonly tokenRepository: Repository<BankConnection>,
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
      const wrapped = this.unwrapTokenError(error);
      this.logger.error(`Token exchange failed: ${wrapped.message}`);

      throw wrapped;
    }
  }

  async syncTransactions(
    accountNumber: string,
    userId: string,
    categoryId: string,
  ): Promise<{ imported: number; skipped: number }> {
    const bankAccount =
      await this.bankAccountsService.findOrCreateByAccountNumber(
        accountNumber,
        userId,
      );

    const accessToken = await this.getTokenForBankAccount(bankAccount.id);

    this.logger.log(`Fetching transactions for account ${accountNumber}...`);
    const abnTransactions = await this.fetchTransactions(
      accessToken,
      accountNumber,
    );
    this.logger.log(`Received ${abnTransactions.length} transactions from API`);

    const entities = abnTransactions.map((t) =>
      this.mapToEntity(t, accountNumber, bankAccount.id, categoryId),
    );

    const seen = await this.transactionsService.findExistingExternalIds(
      bankAccount.id,
      entities.map((e) => e.externalId as string),
    );

    const newEntities = entities.filter((e) => {
      if (seen.has(e.externalId as string)) {
        return false;
      }

      seen.add(e.externalId as string);
      return true;
    });

    if (newEntities.length > 0) {
      await this.transactionsService.bulkCreate(newEntities);
    }

    const skipped = entities.length - newEntities.length;
    this.logger.log(
      `Imported ${newEntities.length} transactions, skipped ${skipped} duplicates`,
    );

    return { imported: newEntities.length, skipped };
  }

  private async getTokenForBankAccount(bankAccountId: string): Promise<string> {
    const record = await this.tokenRepository.findOneBy({ bankAccountId });

    if (!record || record.expiresAt <= new Date()) {
      throw new NotAuthorizedException(
        'No valid ABN AMRO token found for this bank account. ' +
          'Call GET /api/v1/abn-amro/authorization-url to start the OAuth2 flow.',
      );
    }

    return record.accessToken;
  }

  private async saveToken(
    bankAccountId: string,
    plainAccessToken: string,
    plainRefreshToken: string | null,
    expiresAt: Date,
  ): Promise<void> {
    await this.tokenRepository.upsert(
      {
        bankAccountId,
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

      return new ExternalServiceException(
        `Token request failed: ${aggregate.errors.map((e: Error) => e.message).join('; ')}`,
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return new ExternalServiceException(`Token request failed: ${message}`);
  }

  private async fetchTransactions(
    accessToken: string,
    accountNumber: string,
  ): Promise<AbnAmroTransaction[]> {
    const allTransactions: AbnAmroTransaction[] = [];
    const url = `${this.apiUrl}/v1/accounts/${accountNumber}/transactions`;
    let nextPageKey: string | null = null;

    do {
      const params: Record<string, string> = nextPageKey ? { nextPageKey } : {};

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

        const page = response.data.transactions;
        allTransactions.push(...page);
        nextPageKey = response.data.nextPageKey;
        this.logger.log(
          `Fetched ${page.length} transactions (total so far: ${allTransactions.length})`,
        );
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          if (error.response?.status === 401) {
            throw new NotAuthorizedException(
              'ABN AMRO access token is expired or invalid. ' +
                'Call GET /api/v1/abn-amro/authorization-url to re-authorize.',
            );
          }

          if (error.response?.status === 403) {
            throw new NotAuthorizedException(
              'ABN AMRO denied access to this account. ' +
                'Ensure you consented to the correct account during the OAuth2 flow.',
            );
          }
        }

        const msg = error instanceof Error ? error.message : 'Unknown error';
        throw new ExternalServiceException(`ABN AMRO request failed: ${msg}`);
      }
    } while (nextPageKey);

    return allTransactions;
  }

  private mapToEntity(
    abnTransaction: AbnAmroTransaction,
    accountNumber: string,
    bankAccountId: string,
    categoryId: string,
  ): Partial<Transaction> {
    return {
      externalId:
        abnTransaction.transactionId ||
        [
          accountNumber,
          abnTransaction.bookDate,
          abnTransaction.amount,
          abnTransaction.counterPartyAccountNumber ?? '',
        ].join('|'),
      description: abnTransaction.descriptionLines?.join('\n') ?? null,
      amount: abnTransaction.amount,
      date: abnTransaction.bookDate,
      counterpartyName: abnTransaction.counterPartyName ?? null,
      counterpartyAccount: abnTransaction.counterPartyAccountNumber ?? null,
      categoryId,
      bankAccountId,
      tags: [],
    };
  }
}
