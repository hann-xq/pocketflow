import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Tag } from '../src/tags/entities/tag.entity';
import { BankAccount } from '../src/bank-accounts/entities/bank-account.entity';
import { createTestApp } from './test-utils';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { UsersModule } from '../src/users/users.module';
import { CategoriesModule } from '../src/categories/categories.module';
import { TagsModule } from '../src/tags/tags.module';
import { BankAccountsModule } from '../src/bank-accounts/bank-accounts.module';

describe('Transactions (e2e)', () => {
  let app: INestApplication<App>;
  let transactionRepo: Repository<Transaction>;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let tagRepo: Repository<Tag>;
  let bankAccountRepo: Repository<BankAccount>;

  // IDs for shared test fixtures
  let userId: string;
  let categoryId: string;
  let tagId: string;
  let bankAccountId: string;

  beforeAll(async () => {
    app = await createTestApp([
      TransactionsModule,
      UsersModule,
      CategoriesModule,
      TagsModule,
      BankAccountsModule,
    ]);

    const dataSource = app.get(DataSource);
    transactionRepo = dataSource.getRepository(Transaction);
    userRepo = dataSource.getRepository(User);
    categoryRepo = dataSource.getRepository(Category);
    tagRepo = dataSource.getRepository(Tag);
    bankAccountRepo = dataSource.getRepository(BankAccount);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const transactions = await transactionRepo.find({ relations: ['tags'] });
    await transactionRepo.remove(transactions);
    await bankAccountRepo.clear();
    await userRepo.clear();
    await categoryRepo.clear();
    await tagRepo.clear();

    // Seed shared fixtures used by multiple tests
    const user = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({ email: 'tx@example.com', password: 'password123' });
    userId = user.body.id;

    const category = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: 'Shopping' });
    categoryId = category.body.id;

    const tag = await request(app.getHttpServer())
      .post('/api/v1/tags')
      .send({ name: 'online' });
    tagId = tag.body.id;

    const bankAccount = await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .send({ accountNumber: 'NL12ABNA9999876523', accountName: 'Checking', userId });
    bankAccountId = bankAccount.body.id;
  });

  describe('POST /api/v1/transactions', () => {
    it('creates a minimal transaction and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -42.5, date: '2024-01-15', bankAccountId })
        .expect(201);

      expect(Number(res.body.amount)).toBe(-42.5);
      expect(res.body.date).toBe('2024-01-15');
      expect(res.body.id).toBeDefined();
    });

    it('creates a fully populated transaction', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({
          amount: -99.99,
          date: '2024-03-01',
          description: 'Amazon purchase',
          counterpartyName: 'Amazon',
          counterpartyAccount: 'NL99AMAZ0000000001',
          bankAccountId,
          categoryId,
          tagIds: [tagId],
        })
        .expect(201);

      expect(res.body).toMatchObject({
        description: 'Amazon purchase',
        counterpartyName: 'Amazon',
        counterpartyAccount: 'NL99AMAZ0000000001',
      });
    });

    it('returns 400 when amount is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ date: '2024-01-15' })
        .expect(400);
    });

    it('returns 400 when date is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -10 })
        .expect(400);
    });

    it('returns 400 for an invalid date format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -10, date: 'not-a-date' })
        .expect(400);
    });

    it('creates a transaction linked to a bank account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -42.5, date: '2024-01-15', bankAccountId })
        .expect(201);

      expect(res.body.bankAccountId).toBe(bankAccountId);
    });

    it('returns 400 when bankAccountId is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -10, date: '2024-01-15' })
        .expect(400);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -10, date: '2024-01-15', bankAccountId, extra: 'field' })
        .expect(400);
    });
  });

  describe('GET /api/v1/users/:userId/transactions', () => {
    it('returns an empty array when the user has no transactions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/transactions`)
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('returns transactions for the user with relations', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({
          amount: -20,
          date: '2024-01-10',
          bankAccountId,
          categoryId,
          tagIds: [tagId],
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/transactions`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      const tx = res.body[0];
      expect(tx.bankAccount).toMatchObject({ id: bankAccountId });
      expect(tx.category).toMatchObject({ name: 'Shopping' });
      expect(tx.tags).toHaveLength(1);
      expect(tx.tags[0]).toMatchObject({ name: 'online' });
    });

    it('only returns transactions belonging to the specified user', async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ email: 'other@example.com', password: 'password123' });
      const otherAccount = await request(app.getHttpServer())
        .post('/api/v1/bank-accounts')
        .send({ accountNumber: 'NL01ABNA0417164399', accountName: 'Other', userId: otherUser.body.id });

      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -10, date: '2024-01-01', bankAccountId });
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -20, date: '2024-01-02', bankAccountId: otherAccount.body.id });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/transactions`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].bankAccount).toMatchObject({ userId });
    });

    it('returns 400 for an invalid user id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/not-a-uuid/transactions')
        .expect(400);
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('returns the transaction with relations for a valid id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({
          amount: -55,
          date: '2024-06-01',
          bankAccountId,
          categoryId,
          tagIds: [tagId],
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${created.body.id}`)
        .expect(200);

      expect(Number(res.body.amount)).toBe(-55);
      expect(res.body.category).toMatchObject({ name: 'Shopping' });
      expect(res.body.tags).toHaveLength(1);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns the bankAccount relation when set', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -10, date: '2024-01-01', bankAccountId });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${created.body.id}`)
        .expect(200);

      expect(res.body.bankAccount).toMatchObject({ id: bankAccountId });
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/transactions/abc')
        .expect(400);
    });
  });

  describe('PATCH /api/v1/transactions/:id', () => {
    it('updates the transaction amount and description', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -10, date: '2024-01-01', bankAccountId });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${created.body.id}`)
        .send({ amount: -25, description: 'Updated desc' })
        .expect(200);

      expect(Number(res.body.amount)).toBe(-25);
      expect(res.body.description).toBe('Updated desc');
    });

    it('removes all tags from a transaction', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -10, date: '2024-01-01', bankAccountId, tagIds: [tagId] });

      await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${created.body.id}`)
        .send({ tagIds: [] })
        .expect(200);

      const fetched = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${created.body.id}`)
        .expect(200);

      expect(fetched.body.tags).toHaveLength(0);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
        .send({ amount: -5 })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/transactions/:id', () => {
    it('deletes the transaction and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ amount: -10, date: '2024-01-01', bankAccountId });

      await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${created.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/transactions/${created.body.id}`)
        .expect(404);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
