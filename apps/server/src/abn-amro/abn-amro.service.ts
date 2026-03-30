import { Injectable, Logger } from '@nestjs/common';
import { NotAuthorizedException } from '../common/exceptions/not-authorized.exception';
import { TransactionsService } from '../transactions/transactions.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { AbnAmroTokenService } from './abn-amro-token.service';
import { AbnAmroApiClient, TokenExpiredError } from './abn-amro-api.client';
import { AbnAmroTransaction } from './dto/abn-amro-transaction.dto';

/**
 * Orchestrates ABN AMRO transaction sync: resolves the bank account and access
 * token via AbnAmroTokenService, delegates HTTP fetching to AbnAmroApiClient,
 * handles the token-refresh retry cycle, and persists new transactions via
 * TransactionsService.
 */
@Injectable()
export class AbnAmroService {
  private readonly logger = new Logger(AbnAmroService.name);

  constructor(
    private readonly tokenService: AbnAmroTokenService,
    private readonly apiClient: AbnAmroApiClient,
    private readonly transactionsService: TransactionsService,
    private readonly bankAccountsService: BankAccountsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async syncTransactions(
    accountNumber: string,
    userId: string,
  ): Promise<{ imported: number; skipped: number }> {
    const bankAccount =
      await this.bankAccountsService.findOrCreateByAccountNumber(
        accountNumber,
        userId,
      );

    const connection = await this.tokenService.getConnectionForBankAccount(
      bankAccount.id,
    );
    const category = await this.categoriesService.findBySlug(
      CategoriesService.UNCATEGORIZED_SLUG,
    );

    this.logger.log(`Fetching transactions for account ${accountNumber}...`);

    let abnTransactions: AbnAmroTransaction[];

    try {
      abnTransactions = await this.apiClient.fetchTransactions(
        connection.accessToken,
        accountNumber,
      );
    } catch (error) {
      if (!(error instanceof TokenExpiredError)) {
        throw error;
      }

      // Access token rejected (401): attempt a refresh and retry once.
      this.logger.log(
        `Access token rejected for account ${accountNumber}. Attempting token refresh...`,
      );

      const newAccessToken =
        await this.tokenService.refreshAccessToken(connection);

      try {
        abnTransactions = await this.apiClient.fetchTransactions(
          newAccessToken,
          accountNumber,
        );
      } catch (retryError) {
        if (!(retryError instanceof TokenExpiredError)) {
          throw retryError;
        }

        // Still 401 after a successful refresh: the connection is definitively
        // invalid. Remove it and prompt re-authorization.
        await this.tokenService.deleteConnection(bankAccount.id);
        this.logger.warn(
          `Deleted invalid connection for bank account ${bankAccount.id}`,
        );

        throw new NotAuthorizedException(
          'ABN AMRO access token could not be refreshed.',
        );
      }
    }

    this.logger.log(`Received ${abnTransactions.length} transactions from API`);

    const entities = abnTransactions.map((t) =>
      this.mapToEntity(t, accountNumber, bankAccount.id, category.id),
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
