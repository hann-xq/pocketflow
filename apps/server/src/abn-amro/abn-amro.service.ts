import { Injectable, Logger } from '@nestjs/common';
import { NotAuthorizedException } from '../common/exceptions/not-authorized.exception';
import { TransactionsService } from '../transactions/transactions.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { CategoryType } from '../categories/enums/category-type.enum';
import { AbnAmroTokenService } from './abn-amro-token.service';
import { AbnAmroApiClient, TokenExpiredError } from './abn-amro-api.client';
import { AbnAmroActivity } from './dto/abn-amro-activity.dto';

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
    bankAccountId: string,
  ): Promise<{ imported: number; skipped: number }> {
    const bankAccount = await this.bankAccountsService.findOne(bankAccountId);
    const { accountNumber } = bankAccount;

    const connection = await this.tokenService.getConnectionForBankAccount(
      bankAccount.id,
    );
    const category = await this.categoriesService.findBySlug(
      CategoriesService.UNCATEGORIZED_SLUG,
      CategoryType.EXPENSE,
    );

    this.logger.log(`Fetching activities for account ${accountNumber}...`);

    let abnActivities: AbnAmroActivity[];

    try {
      abnActivities = await this.apiClient.fetchActivities(
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
        abnActivities = await this.apiClient.fetchActivities(
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

    this.logger.log(`Received ${abnActivities.length} activities from API`);

    const entities = abnActivities.map((t) =>
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
      `Imported ${newEntities.length} activities, skipped ${skipped} duplicates`,
    );

    return { imported: newEntities.length, skipped };
  }

  private mapToEntity(
    activity: AbnAmroActivity,
    accountNumber: string,
    bankAccountId: string,
    categoryId: string,
  ): Partial<Transaction> {
    const amount =
      activity.creditDebitIndicator === 'DBIT'
        ? -Math.abs(activity.amount)
        : Math.abs(activity.amount);

    return {
      externalId:
        activity.id ||
        [
          accountNumber,
          activity.bookDate,
          activity.amount,
          activity.counterPartyAccountNumber ?? '',
        ].join('|'),
      description: activity.descriptionLines?.join('\n') ?? null,
      amount,
      date: activity.bookDate,
      counterpartyName: activity.counterPartyName ?? null,
      counterpartyAccount: activity.counterPartyAccountNumber ?? null,
      categoryId,
      bankAccountId,
      tags: [],
    };
  }
}
