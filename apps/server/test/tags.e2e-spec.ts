import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './test-utils';
import { TagsModule } from '../src/tags/tags.module';
import { TagsService } from '../src/tags/tags.service';
import { SeederService } from '../src/seeds/seeder.service';
import { SEED_TAGS } from '../src/seeds/seed-data';

describe('Tags (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let tagId: string;

  beforeAll(async () => {
    app = await createTestApp([TagsModule]);
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

    const tags = await app.get(TagsService).findAll();
    tagId = tags.find((t) => t.name === SEED_TAGS[0].name)!.id;
  });

  describe('POST /api/v1/tags', () => {
    it('creates a tag and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tags')
        .send({ name: 'custom-tag' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'custom-tag' });
      expect(res.body.id).toBeDefined();
    });

    it('returns 409 for duplicate name', async () => {
      // SEED_TAGS[0].name is already seeded — no setup needed
      const res = await request(app.getHttpServer())
        .post('/api/v1/tags')
        .send({ name: SEED_TAGS[0].name })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .send({})
        .expect(400);
    });

    it('returns 400 when name is empty', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .send({ name: '' })
        .expect(400);
    });

    it('returns 400 for unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .send({ name: 'new-tag', color: 'blue' })
        .expect(400);
    });
  });

  describe('GET /api/v1/tags', () => {
    it('returns all tags', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tags')
        .expect(200);

      expect(res.body).toHaveLength(SEED_TAGS.length);
      expect(res.body.map((t: any) => t.name)).toEqual(
        expect.arrayContaining(SEED_TAGS.map((t) => t.name)),
      );
    });
  });

  describe('GET /api/v1/tags/:id', () => {
    it('returns the tag for a valid id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tags/${tagId}`)
        .expect(200);

      expect(res.body.name).toBe(SEED_TAGS[0].name);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tags/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer()).get('/api/v1/tags/abc').expect(400);
    });
  });

  describe('PATCH /api/v1/tags/:id', () => {
    it('updates the tag name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tags/${tagId}`)
        .send({ name: 'updated-tag' })
        .expect(200);

      expect(res.body.name).toBe('updated-tag');
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/tags/00000000-0000-0000-0000-000000000000')
        .send({ name: 'ghost' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/tags/:id', () => {
    it('deletes the tag and returns 204', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/tags/${tagId}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/tags/${tagId}`)
        .expect(404);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/tags/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
