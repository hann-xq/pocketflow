import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { createTestApp, getToken } from './test-utils';
import { AbnAmroModule } from '../src/abn-amro/abn-amro.module';
import { AbnAmroTokenService } from '../src/abn-amro/abn-amro-token.service';
import { BankConnection } from '../src/abn-amro/entities/bank-connection.entity';
import { UsersModule } from '../src/users/users.module';
import { CategoriesModule } from '../src/categories/categories.module';
import { SeederService } from '../src/seeds/seeder.service';
import { UsersService } from '../src/users/users.service';
import { TransactionsService } from '../src/transactions/transactions.service';
import { SEED_USER } from '../src/seeds/seed-data';

const ACCOUNT_NUMBER = 'NL12ABNA0123456789';

describe('AbnAmro (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let httpService: HttpService;

  let abnAmroTokenService: AbnAmroTokenService;

  let token: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp([AbnAmroModule, UsersModule, CategoriesModule]);

    dataSource = app.get(DataSource);
    httpService = app.get(HttpService);
    abnAmroTokenService = app.get(AbnAmroTokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // SQLite has no TRUNCATE; drop + recreate is the simplest reset
    await dataSource.synchronize(true);
    // Restore seeded base data and resolve the IDs for this test
    await app.get(SeederService).run();

    jest.restoreAllMocks();
    jest
      .spyOn(abnAmroTokenService, 'getConnectionForBankAccount')
      .mockResolvedValue({
        accessToken: 'mock-token',
        refreshToken: null,
        bankAccountId: '',
        id: '',
        expiresAt: new Date(Date.now() + 3600000),
      } as BankConnection);

    const users = await app.get(UsersService).findAll();
    userId = users.find((u) => u.email === SEED_USER.email)!.id;
    token = await getToken(app);
  });

  describe('POST /api/v1/abn-amro/sync', () => {
    it('returns 401 when no JWT is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/abn-amro/sync')
        .expect(401);
    });

    it('returns 400 when accountNumber query parameter is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/abn-amro/sync')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.message).toContain(
        'accountNumber query parameter is required',
      );
    });

    it('imports transactions and returns the count', async () => {
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        of({
          data: {
            accountNumber: ACCOUNT_NUMBER,
            nextPageKey: null,
            transactions: [
              {
                transactionId: 'tx-001',
                bookDate: '2024-01-15',
                amount: -25.5,
                currencyCode: 'EUR',
                description: 'Coffee shop',
                counterPartyAccountNumber: 'NL99CAFE0000000001',
                counterPartyName: 'Koffie & Zo',
                transactionType: 'DEBIT',
                mutationCode: 'GM',
              },
              {
                transactionId: 'tx-002',
                bookDate: '2024-01-16',
                amount: 1500,
                currencyCode: 'EUR',
                description: 'Salary',
                counterPartyAccountNumber: 'NL99WORK0000000001',
                counterPartyName: 'Employer BV',
                transactionType: 'CREDIT',
                mutationCode: 'OV',
              },
            ],
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({ imported: 2, skipped: 0 });

      const saved = await app.get(TransactionsService).findAllForUser(userId);
      expect(saved).toHaveLength(2);
    });

    it('skips duplicate transactions on a second sync', async () => {
      const mockTransactions = [
        {
          transactionId: 'tx-001',
          bookDate: '2024-01-15',
          amount: -25.5,
          currencyCode: 'EUR',
          description: 'Coffee shop',
          counterPartyAccountNumber: 'NL99CAFE0000000001',
          counterPartyName: 'Koffie & Zo',
          transactionType: 'DEBIT',
          mutationCode: 'GM',
        },
      ];

      const mockResponse = of({
        data: {
          accountNumber: ACCOUNT_NUMBER,
          nextPageKey: null,
          transactions: mockTransactions,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      jest.spyOn(httpService, 'get').mockReturnValueOnce(mockResponse);

      // First sync: import the transaction.
      await request(app.getHttpServer())
        .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      jest.spyOn(httpService, 'get').mockReturnValueOnce(mockResponse);

      // Second sync: same transaction must be skipped.
      const res = await request(app.getHttpServer())
        .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({ imported: 0, skipped: 1 });

      const saved = await app.get(TransactionsService).findAllForUser(userId);
      expect(saved).toHaveLength(1);
    });

    it("assigns imported transactions to the authenticated user's bank account", async () => {
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        of({
          data: {
            accountNumber: ACCOUNT_NUMBER,
            nextPageKey: null,
            transactions: [
              {
                transactionId: 'tx-003',
                bookDate: '2024-02-01',
                amount: -10,
                currencyCode: 'EUR',
                description: 'Test',
                counterPartyAccountNumber: '',
                counterPartyName: '',
                transactionType: 'DEBIT',
                mutationCode: 'GM',
              },
            ],
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await request(app.getHttpServer())
        .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const saved = await app.get(TransactionsService).findAllForUser(userId);
      expect(saved[0].bankAccount.userId).toBe(userId);
    });

    it('paginates through multiple pages of transactions', async () => {
      const mockGet = jest.spyOn(httpService, 'get');

      mockGet.mockReturnValueOnce(
        of({
          data: {
            accountNumber: ACCOUNT_NUMBER,
            nextPageKey: 'page-2-key',
            transactions: [
              {
                transactionId: 'tx-p1',
                bookDate: '2024-01-01',
                amount: -10,
                currencyCode: 'EUR',
                description: 'Page 1',
                counterPartyAccountNumber: '',
                counterPartyName: '',
                transactionType: 'DEBIT',
                mutationCode: 'GM',
              },
            ],
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      mockGet.mockReturnValueOnce(
        of({
          data: {
            accountNumber: ACCOUNT_NUMBER,
            nextPageKey: null,
            transactions: [
              {
                transactionId: 'tx-p2',
                bookDate: '2024-01-02',
                amount: -20,
                currencyCode: 'EUR',
                description: 'Page 2',
                counterPartyAccountNumber: '',
                counterPartyName: '',
                transactionType: 'DEBIT',
                mutationCode: 'GM',
              },
            ],
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({ imported: 2, skipped: 0 });
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    describe('token refresh', () => {
      const connectionWithRefreshToken = {
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        bankAccountId: '',
        id: '',
        expiresAt: new Date(Date.now() - 1000),
      } as BankConnection;

      function axiosError(status: number) {
        return Object.assign(new Error('Request failed'), {
          isAxiosError: true,
          response: {
            status,
            data: {},
            headers: {},
            config: {},
            statusText: '',
          },
        });
      }

      it('retries with the refreshed token and imports transactions', async () => {
        jest
          .spyOn(abnAmroTokenService, 'getConnectionForBankAccount')
          .mockResolvedValue(connectionWithRefreshToken);
        jest
          .spyOn(abnAmroTokenService, 'refreshAccessToken')
          .mockResolvedValue('new-access-token');

        const mockGet = jest
          .spyOn(httpService, 'get')
          .mockReturnValueOnce(throwError(() => axiosError(401)))
          .mockReturnValueOnce(
            of({
              data: {
                accountNumber: ACCOUNT_NUMBER,
                nextPageKey: null,
                transactions: [
                  {
                    transactionId: 'tx-r1',
                    bookDate: '2024-03-01',
                    amount: -15,
                    currencyCode: 'EUR',
                    description: 'Refreshed',
                    counterPartyAccountNumber: '',
                    counterPartyName: '',
                    transactionType: 'DEBIT',
                    mutationCode: 'GM',
                  },
                ],
              },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {} as any,
            }),
          );

        const res = await request(app.getHttpServer())
          .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(res.body).toMatchObject({ imported: 1, skipped: 0 });
        // Verify the retry used the new access token, not the expired one.
        expect(mockGet).toHaveBeenNthCalledWith(
          2,
          expect.stringContaining(ACCOUNT_NUMBER),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer new-access-token',
            }),
          }),
        );
      });

      it('returns 401 and deletes the connection when the refreshed token is also rejected', async () => {
        jest
          .spyOn(abnAmroTokenService, 'getConnectionForBankAccount')
          .mockResolvedValue(connectionWithRefreshToken);
        jest
          .spyOn(abnAmroTokenService, 'refreshAccessToken')
          .mockResolvedValue('new-access-token');

        const deleteConnectionSpy = jest.spyOn(
          abnAmroTokenService,
          'deleteConnection',
        );

        jest
          .spyOn(httpService, 'get')
          .mockReturnValueOnce(throwError(() => axiosError(401)))
          .mockReturnValueOnce(throwError(() => axiosError(401)));

        await request(app.getHttpServer())
          .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(401);

        expect(deleteConnectionSpy).toHaveBeenCalled();
      });

      it('returns 401 without calling the token endpoint when there is no refresh token', async () => {
        // The beforeEach mock returns a connection with refreshToken: null,
        // so refreshAccessToken throws before reaching the token endpoint.
        jest
          .spyOn(httpService, 'get')
          .mockReturnValueOnce(throwError(() => axiosError(401)));

        const postSpy = jest.spyOn(httpService, 'post');

        await request(app.getHttpServer())
          .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(401);

        expect(postSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET /api/v1/abn-amro/authorization-url', () => {
    it('returns 401 when no JWT is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/abn-amro/authorization-url')
        .expect(401);
    });

    it('returns 400 when accountNumber query parameter is missing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/abn-amro/authorization-url')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.message).toContain(
        'accountNumber query parameter is required',
      );
    });

    it('returns an authorization URL for the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/abn-amro/authorization-url?accountNumber=${ACCOUNT_NUMBER}`,
        )
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.authorizationUrl).toContain('response_type=code');
      expect(res.body.authorizationUrl).toContain('state=');
    });
  });
});
