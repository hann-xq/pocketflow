import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Tag } from '../src/tags/entities/tag.entity';
import { createTestApp } from './test-utils';
import { UsersModule } from '../src/users/users.module';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let transactionRepo: Repository<Transaction>;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let tagRepo: Repository<Tag>;

  beforeAll(async () => {
    app = await createTestApp([UsersModule]);

    const dataSource = app.get(DataSource);
    transactionRepo = dataSource.getRepository(Transaction);
    userRepo = dataSource.getRepository(User);
    categoryRepo = dataSource.getRepository(Category);
    tagRepo = dataSource.getRepository(Tag);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const transactions = await transactionRepo.find({ relations: ['tags'] });
    await transactionRepo.remove(transactions);
    await userRepo.clear();
    await categoryRepo.clear();
    await tagRepo.clear();
  });

  describe('POST /api/users', () => {
    it('creates a user and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201);

      expect(res.body).toMatchObject({ email: 'test@example.com' });
      expect(res.body.id).toBeDefined();
      expect(res.body.password).not.toBe('password123');
    });

    it('does not expose the password in the response', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201);

      expect(res.body.password).toBeUndefined();
    });

    it('returns 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'dup@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'dup@example.com', password: 'password123' })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('returns 400 for password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'test@example.com', password: 'short' })
        .expect(400);
    });

    it('returns 400 for unknown fields (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'admin',
        })
        .expect(400);
    });

    it('returns 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ password: 'password123' })
        .expect(400);
    });
  });

  describe('GET /api/users', () => {
    it('returns an empty array when no users exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('returns all users', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'a@example.com', password: 'password123' });
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'b@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .get('/api/users')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.map((u: any) => u.email)).toEqual(
        expect.arrayContaining(['a@example.com', 'b@example.com']),
      );
    });

    it('does not expose passwords in the response', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'a@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .get('/api/users')
        .expect(200);

      res.body.forEach((u: any) => expect(u.password).toBeUndefined());
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns the user for a valid id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'find@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .get(`/api/users/${created.body.id}`)
        .expect(200);

      expect(res.body.email).toBe('find@example.com');
    });

    it('does not expose the password in the response', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'find@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .get(`/api/users/${created.body.id}`)
        .expect(200);

      expect(res.body.password).toBeUndefined();
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer()).get('/api/users/abc').expect(400);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('updates the user email', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'before@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .patch(`/api/users/${created.body.id}`)
        .send({ email: 'after@example.com' })
        .expect(200);

      expect(res.body.email).toBe('after@example.com');
    });

    it('hashes the password on update', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'pwupdate@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .patch(`/api/users/${created.body.id}`)
        .send({ password: 'newpassword123' })
        .expect(200);

      expect(res.body.password).not.toBe('newpassword123');
    });

    it('does not expose the password in the response', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'pwupdate@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .patch(`/api/users/${created.body.id}`)
        .send({ email: 'updated@example.com' })
        .expect(200);

      expect(res.body.password).toBeUndefined();
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/00000000-0000-0000-0000-000000000000')
        .send({ email: 'x@example.com' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deletes the user and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'delete@example.com', password: 'password123' });

      await request(app.getHttpServer())
        .delete(`/api/users/${created.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/users/${created.body.id}`)
        .expect(404);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
