import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Tag } from '../src/tags/entities/tag.entity';
import { createTestApp } from './test-utils';
import { TagsModule } from '../src/tags/tags.module';

describe('Tags (e2e)', () => {
  let app: INestApplication<App>;
  let transactionRepo: Repository<Transaction>;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let tagRepo: Repository<Tag>;

  beforeAll(async () => {
    app = await createTestApp([TagsModule]);

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

  describe('POST /api/tags', () => {
    it('creates a tag and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'recurring' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'recurring' });
      expect(res.body.id).toBeDefined();
    });

    it('returns 409 for duplicate name', async () => {
      await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'important' });

      const res = await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'important' })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 when name is missing', async () => {
      await request(app.getHttpServer()).post('/api/tags').send({}).expect(400);
    });

    it('returns 400 when name is empty', async () => {
      await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: '' })
        .expect(400);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'valid', color: 'blue' })
        .expect(400);
    });
  });

  describe('GET /api/tags', () => {
    it('returns an empty array when no tags exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tags')
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('returns all tags', async () => {
      await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'work' });
      await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'personal' });

      const res = await request(app.getHttpServer())
        .get('/api/tags')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.map((t: any) => t.name)).toEqual(
        expect.arrayContaining(['work', 'personal']),
      );
    });
  });

  describe('GET /api/tags/:id', () => {
    it('returns the tag for a valid id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'subscriptions' });

      const res = await request(app.getHttpServer())
        .get(`/api/tags/${created.body.id}`)
        .expect(200);

      expect(res.body.name).toBe('subscriptions');
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/tags/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer()).get('/api/tags/abc').expect(400);
    });
  });

  describe('PATCH /api/tags/:id', () => {
    it('updates the tag name', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'old-tag' });

      const res = await request(app.getHttpServer())
        .patch(`/api/tags/${created.body.id}`)
        .send({ name: 'new-tag' })
        .expect(200);

      expect(res.body.name).toBe('new-tag');
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/tags/00000000-0000-0000-0000-000000000000')
        .send({ name: 'ghost' })
        .expect(404);
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('deletes the tag and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'to-delete' });

      await request(app.getHttpServer())
        .delete(`/api/tags/${created.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/tags/${created.body.id}`)
        .expect(404);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/tags/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
