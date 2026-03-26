import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Tag } from '../src/tags/entities/tag.entity';
import { createTestApp } from './test-utils';
import { AbnAmroModule } from '../src/abn-amro/abn-amro.module';
import { UsersModule } from '../src/users/users.module';
import { CategoriesModule } from '../src/categories/categories.module';

const ACCOUNT_NUMBER = 'NL12ABNA0123456789';

describe('AbnAmro (e2e)', () => {
  let app: INestApplication<App>;
  let transactionRepo: Repository<Transaction>;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let tagRepo: Repository<Tag>;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeAll(async () => {
    app = await createTestApp([AbnAmroModule, UsersModule, CategoriesModule]);

    const dataSource = app.get(DataSource);

    transactionRepo = dataSource.getRepository(Transaction);
    userRepo = dataSource.getRepository(User);
    categoryRepo = dataSource.getRepository(Category);
    tagRepo = dataSource.getRepository(Tag);

    httpService = app.get(HttpService);
    configService = app.get(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    jest.restoreAllMocks();

    const transactions = await transactionRepo.find({ relations: ['tags'] });
    await transactionRepo.remove(transactions);
    await userRepo.clear();
    await categoryRepo.clear();
    await tagRepo.clear();
  });

  describe('POST /api/v1/abn-amro/sync', () => {
    it('returns an error when accountNumber query parameter is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/abn-amro/sync')
        .expect(200);

      expect(res.body).toMatchObject({
        imported: 0,
        errors: expect.arrayContaining([
          expect.stringContaining('accountNumber query parameter is required'),
        ]),
      });
    });

    it('imports transactions and returns the count', async () => {
      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string, defaultValue?: any) => {
          const values: Record<string, string> = {
            ABN_AMRO_AUTH_URL: 'https://auth.example.com/token',
            ABN_AMRO_API_URL: 'https://api.example.com',
            ABN_AMRO_CLIENT_ID: 'client-id',
            ABN_AMRO_CLIENT_SECRET: 'client-secret',
          };
          return values[key] ?? defaultValue;
        });

      jest.spyOn(httpService, 'post').mockReturnValueOnce(
        of({
          data: {
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 3600,
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

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
        .expect(200);

      expect(res.body).toMatchObject({ imported: 2, errors: [] });

      const saved = await transactionRepo.find();
      expect(saved).toHaveLength(2);
    });

    it('assigns userId and categoryId when provided as query params', async () => {
      const userRes = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ email: 'sync@example.com', password: 'password123' });
      const categoryRes = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Imported' });

      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string, defaultValue?: any) => {
          const values: Record<string, string> = {
            ABN_AMRO_AUTH_URL: 'https://auth.example.com/token',
            ABN_AMRO_API_URL: 'https://api.example.com',
          };
          return values[key] ?? defaultValue;
        });

      jest.spyOn(httpService, 'post').mockReturnValueOnce(
        of({
          data: {
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 3600,
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

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

      const res = await request(app.getHttpServer())
        .post(
          `/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}&userId=${userRes.body.id}&categoryId=${categoryRes.body.id}`,
        )
        .expect(200);

      expect(res.body).toMatchObject({ imported: 1, errors: [] });

      const saved = await transactionRepo.findOne({
        where: {},
        relations: ['user', 'category'],
      });
      expect(saved?.userId).toBe(userRes.body.id);
      expect(saved?.categoryId).toBe(categoryRes.body.id);
    });

    it('paginates through multiple pages of transactions', async () => {
      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string, defaultValue?: any) => {
          const values: Record<string, string> = {
            ABN_AMRO_AUTH_URL: 'https://auth.example.com/token',
            ABN_AMRO_API_URL: 'https://api.example.com',
          };
          return values[key] ?? defaultValue;
        });

      jest.spyOn(httpService, 'post').mockReturnValueOnce(
        of({
          data: {
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 3600,
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

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
        .expect(200);

      expect(res.body).toMatchObject({ imported: 2, errors: [] });
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });
});
