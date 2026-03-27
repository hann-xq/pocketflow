import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { createTestApp } from './test-utils';
import { BankAccount } from '../src/bank-accounts/entities/bank-account.entity';
import { User } from '../src/users/entities/user.entity';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { BankAccountsModule } from '../src/bank-accounts/bank-accounts.module';
import { UsersModule } from '../src/users/users.module';

const ACCOUNT_NUMBER = 'NL12ABNA9999876523';

describe('BankAccounts (e2e)', () => {
  let app: INestApplication<App>;
  let bankAccountRepo: Repository<BankAccount>;
  let userRepo: Repository<User>;
  let transactionRepo: Repository<Transaction>;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp([UsersModule, BankAccountsModule]);

    const dataSource = app.get(DataSource);
    bankAccountRepo = dataSource.getRepository(BankAccount);
    userRepo = dataSource.getRepository(User);
    transactionRepo = dataSource.getRepository(Transaction);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const transactions = await transactionRepo.find({ relations: ['tags'] });
    await transactionRepo.remove(transactions);
    await bankAccountRepo.clear();
    await userRepo.clear();

    const res = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({ email: 'user@example.com', password: 'password123' });

    userId = res.body.id;
  });

  describe('POST /api/v1/bank-accounts', () => {
    it('creates a bank account and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.accountNumber).toBe(ACCOUNT_NUMBER);
      expect(res.body.accountName).toBe('Checking');
      expect(res.body.userId).toBe(userId);
    });

    it('returns 409 for duplicate account number', async () => {
      await request(app.getHttpServer()).post('/api/v1/bank-accounts').send({
        accountNumber: ACCOUNT_NUMBER,
        accountName: 'Checking',
        userId,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Other',
          userId,
        })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 for a non-existent userId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('does not exist')]),
      );
    });

    it('returns 400 when accountNumber is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({ accountName: 'Checking', userId })
        .expect(400);
    });

    it('returns 400 when accountName is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({ accountNumber: ACCOUNT_NUMBER, userId })
        .expect(400);
    });

    it('returns 400 when userId is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({ accountNumber: ACCOUNT_NUMBER, accountName: 'Checking' })
        .expect(400);
    });

    it('returns 400 when userId is not a UUID', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId: 'not-a-uuid',
        })
        .expect(400);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId,
          extra: 'field',
        })
        .expect(400);
    });

    it('allows multiple bank accounts for the same user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: 'NL64ABNA0417164301',
          accountName: 'Checking',
          userId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: 'NL37ABNA0417164302',
          accountName: 'Savings',
          userId,
        })
        .expect(201);
    });
  });

  describe('GET /api/v1/users/:id/bank-accounts', () => {
    it('returns an empty array when the user has no bank accounts', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/bank-accounts`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns all bank accounts belonging to the user', async () => {
      await request(app.getHttpServer()).post('/api/v1/bank-accounts').send({
        accountNumber: 'NL64ABNA0417164301',
        accountName: 'Checking',
        userId,
      });
      await request(app.getHttpServer()).post('/api/v1/bank-accounts').send({
        accountNumber: 'NL37ABNA0417164302',
        accountName: 'Savings',
        userId,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/bank-accounts`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.map((a: any) => a.accountNumber)).toEqual(
        expect.arrayContaining(['NL64ABNA0417164301', 'NL37ABNA0417164302']),
      );
    });

    it('only returns bank accounts belonging to the specified user', async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ email: 'other@example.com', password: 'password123' });

      await request(app.getHttpServer()).post('/api/v1/bank-accounts').send({
        accountNumber: 'NL64ABNA0417164301',
        accountName: 'Checking',
        userId,
      });
      await request(app.getHttpServer()).post('/api/v1/bank-accounts').send({
        accountNumber: 'NL37ABNA0417164302',
        accountName: 'Other',
        userId: otherUser.body.id,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/bank-accounts`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].userId).toBe(userId);
    });

    it('returns 400 for an invalid user id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/not-a-uuid/bank-accounts')
        .expect(400);
    });
  });

  describe('GET /api/v1/bank-accounts/:id', () => {
    it('returns the bank account for a valid id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId,
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/bank-accounts/${created.body.id}`)
        .expect(200);

      expect(res.body.accountNumber).toBe(ACCOUNT_NUMBER);
      expect(res.body.accountName).toBe('Checking');
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/bank-accounts/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/bank-accounts/abc')
        .expect(400);
    });
  });

  describe('PATCH /api/v1/bank-accounts/:id', () => {
    it('updates the account name', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId,
        });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bank-accounts/${created.body.id}`)
        .send({ accountName: 'Main Account' })
        .expect(200);

      expect(res.body.accountName).toBe('Main Account');
    });

    it('returns 400 when attempting to change the account number', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId,
        });

      await request(app.getHttpServer())
        .patch(`/api/v1/bank-accounts/${created.body.id}`)
        .send({ accountNumber: 'NL37ABNA0417164399' })
        .expect(400);
    });

    it('returns 400 when attempting to change the userId', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId,
        });

      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ email: 'other@example.com', password: 'password123' });

      await request(app.getHttpServer())
        .patch(`/api/v1/bank-accounts/${created.body.id}`)
        .send({ userId: otherUser.body.id })
        .expect(400);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/bank-accounts/00000000-0000-0000-0000-000000000000')
        .send({ accountName: 'X' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/bank-accounts/:id', () => {
    it('deletes the bank account and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId,
        });

      await request(app.getHttpServer())
        .delete(`/api/v1/bank-accounts/${created.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/bank-accounts/${created.body.id}`)
        .expect(404);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/bank-accounts/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('deletes all bank accounts when the owner user is deleted', async () => {
      await request(app.getHttpServer()).post('/api/v1/bank-accounts').send({
        accountNumber: ACCOUNT_NUMBER,
        accountName: 'Checking',
        userId,
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .expect(204);

      const remaining = await bankAccountRepo.find();
      expect(remaining).toHaveLength(0);
    });

    it('deletes transactions when the bank account is deleted', async () => {
      const account = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          userId,
        });

      const tx = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({
          amount: -10,
          date: '2024-01-01',
          bankAccountId: account.body.id,
        });

      await request(app.getHttpServer())
        .delete(`/api/v1/bank-accounts/${account.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/transactions/${tx.body.id}`)
        .expect(404);
    });
  });
});
