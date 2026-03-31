import * as crypto from 'crypto';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp, getToken } from './test-utils';
import { BankAccountsModule } from '../src/bank-accounts/bank-accounts.module';
import { BankAccountsService } from '../src/bank-accounts/bank-accounts.service';
import { ExternalConnectionType } from '../src/bank-accounts/enums/external-connection-type.enum';
import { UsersModule } from '../src/users/users.module';
import { UsersService } from '../src/users/users.service';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { CategoriesModule } from '../src/categories/categories.module';
import { CategoriesService } from '../src/categories/categories.service';
import { SeederService } from '../src/seeds/seeder.service';
import { BankConnection } from '../src/abn-amro/entities/bank-connection.entity';
import { SEED_BANK_ACCOUNT, SEED_USER } from '../src/seeds/seed-data';

// A valid Dutch IBAN used for tests that create their own bank account
const ACCOUNT_NUMBER = 'NL12ABNA9999876523';

describe('BankAccounts (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let bankAccountId: string; // seeded bank account, restored before each test
  let categoryId: string;
  let token: string;

  beforeAll(async () => {
    process.env['ENCRYPTION_KEY'] = crypto.randomBytes(32).toString('hex');

    app = await createTestApp([
      UsersModule,
      BankAccountsModule,
      TransactionsModule,
      CategoriesModule,
    ]);

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
    delete process.env['ENCRYPTION_KEY'];
  });

  beforeEach(async () => {
    // SQLite has no TRUNCATE; drop + recreate is the simplest reset
    await dataSource.synchronize(true);
    // Restore seeded base data and resolve the IDs for this test
    await app.get(SeederService).run();

    const users = await app.get(UsersService).findAll();
    userId = users.find((u) => u.email === SEED_USER.email)!.id;

    const bankAccounts = await app
      .get(BankAccountsService)
      .findAllForUser(userId);
    bankAccountId = bankAccounts[0].id;

    const categories = await app.get(CategoriesService).findAll();
    categoryId = categories[0].id;

    token = await getToken(app);
  });

  async function connectBankAccount(accountId: string): Promise<void> {
    await dataSource.getRepository(BankConnection).save({
      bankAccountId: accountId,
      type: ExternalConnectionType.AbnAmro,
      accessToken: 'test-token',
      refreshToken: null,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });
  }

  // Creates a second user with their own bank account (ACCOUNT_NUMBER).
  // Used by tests that verify cross-user access is forbidden.
  async function setupOtherUser() {
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
      .send({ accountNumber: ACCOUNT_NUMBER, accountName: 'Other' })
      .expect(201);

    return { otherUserId, otherToken, otherAccountId: otherAccount.body.id };
  }

  describe('POST /api/v1/users/:userId/bank-accounts', () => {
    it('creates a bank account and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.accountNumber).toBe(ACCOUNT_NUMBER);
      expect(res.body.accountName).toBe('Checking');
      expect(res.body.userId).toBe(userId);
      expect(res.body.connectionType).toBeNull();
      expect(res.body).not.toHaveProperty('bankConnection');
    });

    it('returns 409 for duplicate account number', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
        });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Other',
        })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 403 when creating a bank account for another user', async () => {
      const { otherUserId } = await setupOtherUser();

      await request(app.getHttpServer())
        .post(`/api/v1/users/${otherUserId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountNumber: ACCOUNT_NUMBER, accountName: 'Checking' })
        .expect(403);
    });

    it('returns 400 when accountNumber is missing', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountName: 'Checking' })
        .expect(400);
    });

    it('returns 400 when accountName is missing', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountNumber: ACCOUNT_NUMBER })
        .expect(400);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
          extra: 'field',
        })
        .expect(400);
    });

    it('allows multiple bank accounts for the same user', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: 'NL64ABNA0417164301',
          accountName: 'Checking',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: 'NL37ABNA0417164302',
          accountName: 'Savings',
        })
        .expect(201);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Checking',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/users/:userId/bank-accounts', () => {
    it('returns all bank accounts belonging to the user', async () => {
      // Seeded account is already present; add one more to verify the list
      await request(app.getHttpServer())
        .post(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: ACCOUNT_NUMBER,
          accountName: 'Savings',
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).not.toHaveProperty('bankConnection');
    });

    it('only returns bank accounts belonging to the specified user', async () => {
      await setupOtherUser();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Only the seeded account belongs to userId
      expect(res.body).toHaveLength(1);
      expect(res.body[0].userId).toBe(userId);
      expect(res.body[0]).not.toHaveProperty('bankConnection');
    });

    it('returns connectionType abn-amro and omits bankConnection when connected', async () => {
      await connectBankAccount(bankAccountId);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body[0].connectionType).toBe(ExternalConnectionType.AbnAmro);
      expect(res.body[0]).not.toHaveProperty('bankConnection');
    });

    it('returns 403 when accessing another user bank accounts', async () => {
      const { otherUserId } = await setupOtherUser();

      await request(app.getHttpServer())
        .get(`/api/v1/users/${otherUserId}/bank-accounts`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 400 for an invalid user id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/not-a-uuid/bank-accounts')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/bank-accounts/:id', () => {
    it('returns the bank account for a valid id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/bank-accounts/${bankAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.accountNumber).toBe(SEED_BANK_ACCOUNT.accountNumber);
      expect(res.body.accountName).toBe(SEED_BANK_ACCOUNT.accountName);
      expect(res.body.connectionType).toBeNull();
      expect(res.body).not.toHaveProperty('bankConnection');
    });

    it('returns connectionType abn-amro and omits bankConnection when connected', async () => {
      await connectBankAccount(bankAccountId);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/bank-accounts/${bankAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.connectionType).toBe(ExternalConnectionType.AbnAmro);
      expect(res.body).not.toHaveProperty('bankConnection');
    });

    it('returns 403 when accessing another user bank account', async () => {
      const { otherAccountId } = await setupOtherUser();

      await request(app.getHttpServer())
        .get(`/api/v1/bank-accounts/${otherAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/bank-accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/bank-accounts/abc')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('PATCH /api/v1/bank-accounts/:id', () => {
    it('updates the account name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bank-accounts/${bankAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountName: 'Main Account' })
        .expect(200);

      expect(res.body.accountName).toBe('Main Account');
      expect(res.body.connectionType).toBeNull();
      expect(res.body).not.toHaveProperty('bankConnection');
    });

    it('returns connectionType abn-amro and omits bankConnection when connected', async () => {
      await connectBankAccount(bankAccountId);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bank-accounts/${bankAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountName: 'Main Account' })
        .expect(200);

      expect(res.body.connectionType).toBe(ExternalConnectionType.AbnAmro);
      expect(res.body).not.toHaveProperty('bankConnection');
    });

    it('returns 400 when attempting to change the account number', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/bank-accounts/${bankAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountNumber: 'NL37ABNA0417164399' })
        .expect(400);
    });

    it('returns 403 when updating another user bank account', async () => {
      const { otherAccountId } = await setupOtherUser();

      await request(app.getHttpServer())
        .patch(`/api/v1/bank-accounts/${otherAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountName: 'Hijacked' })
        .expect(403);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/bank-accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ accountName: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/bank-accounts/:id', () => {
    it('deletes the bank account and returns 204', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/bank-accounts/${bankAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/bank-accounts/${bankAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 403 when deleting another user bank account', async () => {
      const { otherAccountId } = await setupOtherUser();

      await request(app.getHttpServer())
        .delete(`/api/v1/bank-accounts/${otherAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/bank-accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('deletes all bank accounts when the owner user is deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const remaining = await app
        .get(BankAccountsService)
        .findAllForUser(userId);
      expect(remaining).toHaveLength(0);
    });

    it('deletes transactions when the bank account is deleted', async () => {
      const tx = await request(app.getHttpServer())
        .post(`/api/v1/bank-accounts/${bankAccountId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -10, date: '2024-01-01', categoryId });

      await request(app.getHttpServer())
        .delete(`/api/v1/bank-accounts/${bankAccountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/transactions/${tx.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
