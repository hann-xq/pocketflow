import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp, getToken } from './test-utils';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { UsersModule } from '../src/users/users.module';
import { CategoriesModule } from '../src/categories/categories.module';
import { TagsModule } from '../src/tags/tags.module';
import { BankAccountsModule } from '../src/bank-accounts/bank-accounts.module';
import { SeederService } from '../src/seeds/seeder.service';
import { UsersService } from '../src/users/users.service';
import { CategoriesService } from '../src/categories/categories.service';
import { CategoryType } from '../src/categories/enums/category-type.enum';
import { TagsService } from '../src/tags/tags.service';
import { BankAccountsService } from '../src/bank-accounts/bank-accounts.service';
import { SEED_ADMIN, SEED_USER } from '../src/seeds/seed-data';
import { Transaction } from '../src/transactions/entities/transaction.entity';

describe('Transactions (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  // IDs for shared test fixtures
  let userId: string;
  let expenseCategoryId: string;
  let incomeCategoryId: string;
  let tagId: string;
  let bankAccountId: string;
  let token: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp([
      TransactionsModule,
      UsersModule,
      CategoriesModule,
      TagsModule,
      BankAccountsModule,
    ]);
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // SQLite has no TRUNCATE; drop + recreate is the simplest reset
    await dataSource.synchronize(true);
    // Restore seeded base data and resolve the IDs for this test
    await app.get(SeederService).run();

    const users = await app.get(UsersService).findAll();
    userId = users.find((u) => u.email === SEED_USER.email)!.id;

    const categories = await app.get(CategoriesService).findAll();
    expenseCategoryId = categories.find(
      (c) => c.type === CategoryType.EXPENSE && c.slug !== null,
    )!.id;
    incomeCategoryId = categories.find(
      (c) => c.type === CategoryType.INCOME && c.slug !== null,
    )!.id;

    const tags = await app.get(TagsService).findAll(userId);
    tagId = tags[0].id;

    const bankAccounts = await app
      .get(BankAccountsService)
      .findAllForUser(userId);
    bankAccountId = bankAccounts[0].id;

    token = await getToken(app);
    adminToken = await getToken(app, SEED_ADMIN.email, SEED_ADMIN.password);
  });

  // Creates a second user with their own bank account and one transaction.
  // Used by tests that verify cross-user access is forbidden.
  async function setupOtherUserWithTransaction() {
    const otherUser = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        email: 'other@example.com',
        password: SEED_USER.password,
        firstName: 'Other',
        lastName: 'User',
      })
      .expect(201);

    const otherUserId = otherUser.body.id;

    const otherToken = await getToken(
      app,
      'other@example.com',
      SEED_USER.password,
    );

    const otherAccount = await request(app.getHttpServer())
      .post(`/api/v1/users/${otherUserId}/bank-accounts`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ accountNumber: 'NL64ABNA0417164301', accountName: 'Other' })
      .expect(201);
    const otherAccountId = otherAccount.body.id;

    const otherTx = await request(app.getHttpServer())
      .post(`/api/v1/bank-accounts/${otherAccountId}/transactions`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ amount: -10, date: '2024-01-01', categoryId: expenseCategoryId })
      .expect(201);

    return {
      otherUserId,
      otherToken,
      otherAccountId,
      otherTxId: otherTx.body.id,
    };
  }

  describe('POST /api/v1/bank-accounts/:bankAccountId/transactions', () => {
    it('creates a minimal expense transaction and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -42.5,
          date: '2024-01-15',
          categoryId: expenseCategoryId,
        })
        .expect(201);

      expect(Number(res.body.amount)).toBe(-42.5);
      expect(res.body.date).toBe('2024-01-15');
      expect(res.body.id).toBeDefined();
    });

    it('creates an income transaction with an income category and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 2500,
          date: '2024-01-31',
          categoryId: incomeCategoryId,
        })
        .expect(201);

      expect(Number(res.body.amount)).toBe(2500);
      expect(res.body.category.type).toBe(CategoryType.INCOME);
    });

    it('creates a fully populated transaction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -99.99,
          date: '2024-03-01',
          description: 'Amazon purchase',
          counterpartyName: 'Amazon',
          counterpartyAccount: 'NL91ABNA0417164300',
          categoryId: expenseCategoryId,
          tagIds: [tagId],
        })
        .expect(201);

      expect(res.body).toMatchObject({
        description: 'Amazon purchase',
        counterpartyName: 'Amazon',
        counterpartyAccount: 'NL91ABNA0417164300',
      });
    });

    it('returns 400 when a positive amount is used with an expense category', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 100,
          date: '2024-01-15',
          categoryId: expenseCategoryId,
        })
        .expect(400);
    });

    it('returns 400 when a negative amount is used with an income category', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -50, date: '2024-01-15', categoryId: incomeCategoryId })
        .expect(400);
    });

    it('returns 400 when amount is missing', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: '2024-01-15' })
        .expect(400);
    });

    it('returns 400 when date is missing', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -10 })
        .expect(400);
    });

    it('returns 400 for an invalid date format', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -10, date: 'not-a-date' })
        .expect(400);
    });

    it('links the transaction to the bank account from the URL', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -42.5,
          date: '2024-01-15',
          categoryId: expenseCategoryId,
        })
        .expect(201);

      expect(res.body.bankAccountId).toBe(bankAccountId);
    });

    it('returns 404 for a non-existent bank account', async () => {
      await request(app.getHttpServer())
        .post(
          '/api/v1/bank-accounts/00000000-0000-0000-0000-000000000000/transactions',
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-15',
          categoryId: expenseCategoryId,
        })
        .expect(404);
    });

    it('returns 403 when adding a transaction to another user bank account', async () => {
      const { otherAccountId } = await setupOtherUserWithTransaction();

      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${otherAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
        })
        .expect(403);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-15',
          categoryId: expenseCategoryId,
          extra: 'field',
        })
        .expect(400);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .send({
          amount: -10,
          date: '2024-01-15',
          categoryId: expenseCategoryId,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/users/:userId/transactions', () => {
    it('returns an empty array when the user has no transactions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('returns transactions for the user with relations', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -20,
          date: '2024-01-10',
          categoryId: expenseCategoryId,
          tagIds: [tagId],
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      const tx = res.body[0];
      expect(tx.bankAccount).toMatchObject({ id: bankAccountId });
      expect(tx.category).toMatchObject({ id: expenseCategoryId });
      expect(tx.tags).toHaveLength(1);
      expect(tx.tags[0]).toMatchObject({ id: tagId });
    });

    it('only returns transactions belonging to the specified user', async () => {
      const { otherToken, otherAccountId } =
        await setupOtherUserWithTransaction();

      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
        });
      await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${otherAccountId}/transactions`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          amount: -20,
          date: '2024-01-02',
          categoryId: expenseCategoryId,
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].bankAccount).toMatchObject({ userId });
    });

    it('returns 403 when accessing another user transactions', async () => {
      const { otherUserId } = await setupOtherUserWithTransaction();

      await request(app.getHttpServer())
        .get(`/api/v1/users/${otherUserId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 400 for an invalid user id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/not-a-uuid/transactions')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('returns the transaction with relations for a valid id', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -55,
          date: '2024-06-01',
          categoryId: expenseCategoryId,
          tagIds: [tagId],
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Number(res.body.amount)).toBe(-55);
      expect(res.body.category).toMatchObject({ id: expenseCategoryId });
      expect(res.body.tags).toHaveLength(1);
    });

    it('returns 403 when accessing another user transaction', async () => {
      const { otherTxId } = await setupOtherUserWithTransaction();

      await request(app.getHttpServer())
        .get(`/api/v1/transactions/${otherTxId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns the bankAccount relation when set', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.bankAccount).toMatchObject({ id: bankAccountId });
    });

    it('does not expose externalId and exposes isExternal instead', async () => {
      const txRepo = dataSource.getRepository(Transaction);
      const externalTx = await txRepo.save(
        txRepo.create({
          externalId: 'ext-001',
          amount: -20,
          date: '2024-01-01',
          bankAccountId,
          categoryId: expenseCategoryId,
          tags: [],
        }),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${externalTx.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.externalId).toBeUndefined();
      expect(res.body.isExternal).toBe(true);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/transactions/abc')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('PATCH /api/v1/transactions/:id', () => {
    it('updates the transaction amount and description', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
        });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -25, description: 'Updated desc' })
        .expect(200);

      expect(Number(res.body.amount)).toBe(-25);
      expect(res.body.description).toBe('Updated desc');
    });

    it('returns 400 when updating the description of an external transaction', async () => {
      const txRepo = dataSource.getRepository(Transaction);
      const externalTx = await txRepo.save(
        txRepo.create({
          externalId: 'ext-001',
          amount: -20,
          date: '2024-01-01',
          bankAccountId,
          categoryId: expenseCategoryId,
          tags: [],
        }),
      );

      await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${externalTx.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'New description' })
        .expect(400);
    });

    it('removes all tags from a transaction', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
          tagIds: [tagId],
        });

      await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tagIds: [] })
        .expect(200);

      const fetched = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(fetched.body.tags).toHaveLength(0);
    });

    it('updates the category relation when categoryId changes to a matching type', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
        })
        .expect(201);

      const newCategory = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Travel', type: CategoryType.EXPENSE })
        .expect(201);
      const newCategoryId = newCategory.body.id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ categoryId: newCategoryId })
        .expect(200);

      expect(res.body.categoryId).toBe(newCategoryId);
    });

    it('returns 400 when updating amount to positive without changing to income category', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 50 })
        .expect(400);
    });

    it('returns 400 when switching to income category without updating to positive amount', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ categoryId: incomeCategoryId })
        .expect(400);
    });

    it('allows updating both amount and category to a consistent income combination', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 500, categoryId: incomeCategoryId })
        .expect(200);

      expect(Number(res.body.amount)).toBe(500);
      expect(res.body.category.type).toBe(CategoryType.INCOME);
    });

    it('returns 403 when updating another user transaction', async () => {
      const { otherTxId } = await setupOtherUserWithTransaction();

      await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${otherTxId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -5 })
        .expect(403);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -5 })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/transactions/:id', () => {
    it('deletes the transaction and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -10,
          date: '2024-01-01',
          categoryId: expenseCategoryId,
        });

      await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 403 when deleting another user transaction', async () => {
      const { otherTxId } = await setupOtherUserWithTransaction();

      await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${otherTxId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
