import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp, getToken } from './test-utils';
import { CategoriesModule } from '../src/categories/categories.module';
import { CategoriesService } from '../src/categories/categories.service';
import { SeederService } from '../src/seeds/seeder.service';
import { SEED_ADMIN, SEED_CATEGORIES } from '../src/seeds/seed-data';

describe('Categories (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let categoryId: string;
  let token: string;
  let regularToken: string;

  beforeAll(async () => {
    app = await createTestApp([CategoriesModule]);
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

    const categories = await app.get(CategoriesService).findAll();
    categoryId = categories.find((c) => c.name === SEED_CATEGORIES[0].name)!.id;

    token = await getToken(app, SEED_ADMIN.email, SEED_ADMIN.password);
    regularToken = await getToken(app);
  });

  describe('POST /api/v1/categories', () => {
    it('creates a category and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Custom Category', description: 'A custom description' })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Custom Category',
        description: 'A custom description',
      });
      expect(res.body.id).toBeDefined();
    });

    it('creates a category without optional description', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Category' })
        .expect(201);

      expect(res.body.name).toBe('New Category');
    });

    it('returns 409 for duplicate name', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: SEED_CATEGORIES[0].name })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No name here' })
        .expect(400);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Valid', color: 'red' })
        .expect(400);
    });

    it('returns 403 for a non-admin user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ name: 'New Category' })
        .expect(403);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'New Category' })
        .expect(401);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('returns all categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(res.body).toHaveLength(SEED_CATEGORIES.length);
      expect(res.body.map((c: any) => c.name)).toEqual(
        expect.arrayContaining(SEED_CATEGORIES.map((c) => c.name)),
      );
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('returns the category for a valid id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}`)
        .expect(200);

      expect(res.body).toMatchObject({
        name: SEED_CATEGORIES[0].name,
        description: SEED_CATEGORIES[0].description,
      });
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/categories/00000000-0000-0000-0000-000000000000`)
        .expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/categories/abc')
        .expect(400);
    });
  });

  describe('PATCH /api/v1/categories/:id', () => {
    it('updates the category name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'NewName' })
        .expect(200);

      expect(res.body.name).toBe('NewName');
    });

    it('updates the description', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'New desc' })
        .expect(200);

      expect(res.body.description).toBe('New desc');
    });

    it('returns 403 for a non-admin user', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ name: 'Stolen' })
        .expect(403);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .send({ name: 'Stolen' })
        .expect(401);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/categories/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('deletes the category and returns 204', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}`)
        .expect(404);
    });

    it('returns 403 for a non-admin user', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .expect(401);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
