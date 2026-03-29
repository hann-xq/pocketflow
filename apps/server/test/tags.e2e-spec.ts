import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp, getToken } from './test-utils';
import { TagsModule } from '../src/tags/tags.module';
import { TagsService } from '../src/tags/tags.service';
import { UsersModule } from '../src/users/users.module';
import { UsersService } from '../src/users/users.service';
import { SeederService } from '../src/seeds/seeder.service';
import { SEED_TAGS, SEED_USER } from '../src/seeds/seed-data';

describe('Tags (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let tagId: string;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp([TagsModule, UsersModule]);
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
    token = await getToken(app);

    const tags = await app.get(TagsService).findAll(userId);
    tagId = tags.find((t) => t.name === SEED_TAGS[0].name)!.id;
  });

  describe('POST /api/v1/tags', () => {
    it('creates a tag and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'custom-tag' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'custom-tag' });
      expect(res.body.id).toBeDefined();
    });

    it('returns 409 for duplicate name', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: SEED_TAGS[0].name })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('returns 400 when name is empty', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' })
        .expect(400);
    });

    it('returns 400 when name exceeds 50 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'a'.repeat(51) })
        .expect(400);
    });

    it('returns 400 when name contains invalid characters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'invalid name!' })
        .expect(400);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'new-tag', color: 'blue' })
        .expect(400);
    });

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .send({ name: 'custom-tag' })
        .expect(401);
    });
  });

  describe('GET /api/v1/tags', () => {
    it('returns all tags for the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tags')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(SEED_TAGS.length);
      expect(res.body.map((t: any) => t.name)).toEqual(
        expect.arrayContaining(SEED_TAGS.map((t) => t.name)),
      );
    });

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer()).get('/api/v1/tags').expect(401);
    });
  });

  describe('GET /api/v1/tags/:id', () => {
    it('returns the tag for a valid id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.name).toBe(SEED_TAGS[0].name);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tags/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tags/abc')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tags/${tagId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/tags/:id', () => {
    it('updates the tag name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'updated-tag' })
        .expect(200);

      expect(res.body.name).toBe('updated-tag');
    });

    it('returns 409 when renaming to an existing tag name', async () => {
      // SEED_TAGS[1].name is a different seeded tag belonging to the same user
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: SEED_TAGS[1].name })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 when name exceeds 50 characters', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'a'.repeat(51) })
        .expect(400);
    });

    it('returns 400 when name contains invalid characters', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'invalid name!' })
        .expect(400);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/tags/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'nonexistent' })
        .expect(404);
    });

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/tags/${tagId}`)
        .send({ name: 'updated-tag' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/tags/:id', () => {
    it('deletes the tag and returns 204', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/tags/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/tags/${tagId}`)
        .expect(401);
    });
  });
});
