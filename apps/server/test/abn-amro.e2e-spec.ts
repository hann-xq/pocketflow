import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Tag } from '../src/tags/entities/tag.entity';
import { BankAccount } from '../src/bank-accounts/entities/bank-account.entity';
import { createTestApp } from './test-utils';
import { AbnAmroModule } from '../src/abn-amro/abn-amro.module';
import { AbnAmroService } from '../src/abn-amro/abn-amro.service';
import { UsersModule } from '../src/users/users.module';
import { CategoriesModule } from '../src/categories/categories.module';

const ACCOUNT_NUMBER = 'NL12ABNA0123456789';

describe('AbnAmro (e2e)', () => {
  let app: INestApplication<App>;
  let transactionRepo: Repository<Transaction>;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let tagRepo: Repository<Tag>;
  let bankAccountRepo: Repository<BankAccount>;
  let httpService: HttpService;
  let abnAmroService: AbnAmroService;

  beforeAll(async () => {
    app = await createTestApp([AbnAmroModule, UsersModule, CategoriesModule]);

    const dataSource = app.get(DataSource);

    transactionRepo = dataSource.getRepository(Transaction);
    userRepo = dataSource.getRepository(User);
    categoryRepo = dataSource.getRepository(Category);
    tagRepo = dataSource.getRepository(Tag);
    bankAccountRepo = dataSource.getRepository(BankAccount);

    httpService = app.get(HttpService);
    abnAmroService = app.get(AbnAmroService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest
      .spyOn(abnAmroService as any, 'getStoredToken')
      .mockReturnValue('mock-token');

    const transactions = await transactionRepo.find({ relations: ['tags'] });
    await transactionRepo.remove(transactions);
    await bankAccountRepo.clear();
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

    it('returns an error when userId query parameter is missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}`)
        .expect(200);

      expect(res.body).toMatchObject({
        imported: 0,
        errors: expect.arrayContaining([
          expect.stringContaining('userId query parameter is required'),
        ]),
      });
    });

    it('imports transactions and returns the count', async () => {
      const userRes = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ email: 'import@example.com', password: 'password123' });

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
        .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}&userId=${userRes.body.id}`)
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
        relations: ['bankAccount', 'category'],
      });
      expect(saved?.bankAccount?.userId).toBe(userRes.body.id);
      expect(saved?.categoryId).toBe(categoryRes.body.id);
    });

    it('paginates through multiple pages of transactions', async () => {
      const userRes = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ email: 'paginate@example.com', password: 'password123' });

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
        .post(`/api/v1/abn-amro/sync?accountNumber=${ACCOUNT_NUMBER}&userId=${userRes.body.id}`)
        .expect(200);

      expect(res.body).toMatchObject({ imported: 2, errors: [] });
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });
});
