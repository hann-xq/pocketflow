import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp, getToken } from './test-utils';
import { CategoriesModule } from '../src/categories/categories.module';
import { CategoriesService } from '../src/categories/categories.service';
import { CategoryType } from '../src/categories/enums/category-type.enum';
import { SeederService } from '../src/seeds/seeder.service';
import { SEED_ADMIN, SEED_CATEGORIES } from '../src/seeds/seed-data';

describe('Categories (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let expenseCategoryId: string;
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
    expenseCategoryId = categories.find(
      (c) => c.slug === 'uncategorized' && c.type === CategoryType.EXPENSE,
    )!.id;

    token = await getToken(app, SEED_ADMIN.email, SEED_ADMIN.password);
    regularToken = await getToken(app);
  });

  describe('POST /api/v1/categories', () => {
    it('creates an expense category and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Custom Expense',
          description: 'A custom description',
          type: CategoryType.EXPENSE,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Custom Expense',
        description: 'A custom description',
        type: CategoryType.EXPENSE,
      });
      expect(res.body.id).toBeDefined();
    });

    it('creates an income category and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Bonus', type: CategoryType.INCOME })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Bonus',
        type: CategoryType.INCOME,
      });
    });

    it('allows same name for different types', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Other', type: CategoryType.EXPENSE })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Other', type: CategoryType.INCOME })
        .expect(201);
    });

    it('creates a category without optional description', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Category', type: CategoryType.EXPENSE })
        .expect(201);

      expect(res.body.name).toBe('New Category');
    });

    it('returns 409 for duplicate name within the same type', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: SEED_CATEGORIES[0].name, type: CategoryType.EXPENSE })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No name here', type: CategoryType.EXPENSE })
        .expect(400);
    });

    it('returns 400 when type is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'No Type' })
        .expect(400);
    });

    it('returns 400 for an invalid type value', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Bad Type', type: 'invalid' })
        .expect(400);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Valid', type: CategoryType.EXPENSE, color: 'red' })
        .expect(400);
    });

    it('returns 403 for a non-admin user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ name: 'New Category', type: CategoryType.EXPENSE })
        .expect(403);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'New Category', type: CategoryType.EXPENSE })
        .expect(401);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('returns all categories including both expense and income', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(res.body).toHaveLength(SEED_CATEGORIES.length);
      expect(res.body.every((c: any) => c.type !== undefined)).toBe(true);
    });

    it('includes both expense and income types in the response', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      const types: string[] = res.body.map((c: any) => c.type);
      expect(types).toContain(CategoryType.EXPENSE);
      expect(types).toContain(CategoryType.INCOME);
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('returns the category with its type for a valid id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${expenseCategoryId}`)
        .expect(200);

      expect(res.body).toMatchObject({
        name: SEED_CATEGORIES[0].name,
        type: CategoryType.EXPENSE,
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
        .patch(`/api/v1/categories/${expenseCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'NewName' })
        .expect(200);

      expect(res.body.name).toBe('NewName');
    });

    it('updates the description', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${expenseCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'New desc' })
        .expect(200);

      expect(res.body.description).toBe('New desc');
    });

    it('returns 400 when attempting to change the type', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/categories/${expenseCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: CategoryType.INCOME })
        .expect(400);
    });

    it('preserves the original type after an update', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${expenseCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renamed' })
        .expect(200);

      expect(res.body.type).toBe(CategoryType.EXPENSE);
    });

    it('returns 403 for a non-admin user', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/categories/${expenseCategoryId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ name: 'Stolen' })
        .expect(403);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/categories/${expenseCategoryId}`)
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
        .delete(`/api/v1/categories/${expenseCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/categories/${expenseCategoryId}`)
        .expect(404);
    });

    it('returns 403 for a non-admin user', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${expenseCategoryId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${expenseCategoryId}`)
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
