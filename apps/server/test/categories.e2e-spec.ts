import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Tag } from '../src/tags/entities/tag.entity';
import { createTestApp } from './test-utils';
import { CategoriesModule } from '../src/categories/categories.module';

describe('Categories (e2e)', () => {
  let app: INestApplication<App>;
  let transactionRepo: Repository<Transaction>;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let tagRepo: Repository<Tag>;

  beforeAll(async () => {
    app = await createTestApp([CategoriesModule]);

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

  describe('POST /api/v1/categories', () => {
    it('creates a category and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Groceries', description: 'Food and drink' })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Groceries',
        description: 'Food and drink',
      });
      expect(res.body.id).toBeDefined();
    });

    it('creates a category without optional description', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Transport' })
        .expect(201);

      expect(res.body.name).toBe('Transport');
    });

    it('returns 409 for duplicate name', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Utilities' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Utilities' })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ description: 'No name here' })
        .expect(400);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Valid', color: 'red' })
        .expect(400);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('returns an empty array when no categories exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('returns all categories', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Food' });
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Travel' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.map((c: any) => c.name)).toEqual(
        expect.arrayContaining(['Food', 'Travel']),
      );
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('returns the category for a valid id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Entertainment', description: 'Fun stuff' });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${created.body.id}`)
        .expect(200);

      expect(res.body).toMatchObject({
        name: 'Entertainment',
        description: 'Fun stuff',
      });
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer()).get('/api/v1/categories/abc').expect(400);
    });
  });

  describe('PATCH /api/v1/categories/:id', () => {
    it('updates the category name', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'OldName' });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${created.body.id}`)
        .send({ name: 'NewName' })
        .expect(200);

      expect(res.body.name).toBe('NewName');
    });

    it('updates the description', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'WithDesc', description: 'Old desc' });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${created.body.id}`)
        .send({ description: 'New desc' })
        .expect(200);

      expect(res.body.description).toBe('New desc');
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Ghost' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('deletes the category and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'ToDelete' });

      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${created.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/categories/${created.body.id}`)
        .expect(404);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
