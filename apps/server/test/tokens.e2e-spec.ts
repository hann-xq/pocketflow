import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './test-utils';
import { SeederService } from '../src/seeds/seeder.service';
import { SEED_USER } from '../src/seeds/seed-data';

describe('Tokens (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    await app.get(SeederService).run();
  });

  describe('POST /api/v1/tokens', () => {
    it('returns 200 with an access token for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tokens')
        .send({ email: SEED_USER.email, password: SEED_USER.password })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('does not expose any user fields in the response', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tokens')
        .send({ email: SEED_USER.email, password: SEED_USER.password })
        .expect(200);

      expect(res.body.password).toBeUndefined();
      expect(res.body.email).toBeUndefined();
      expect(res.body.id).toBeUndefined();
    });

    it('returns 401 for an incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tokens')
        .send({ email: SEED_USER.email, password: 'wrong-password' })
        .expect(401);
    });

    it('returns 401 for a non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tokens')
        .send({ email: 'nobody@example.com', password: SEED_USER.password })
        .expect(401);
    });

    it('returns 400 for an invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tokens')
        .send({ email: 'not-an-email', password: SEED_USER.password })
        .expect(400);
    });

    it('returns 400 when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tokens')
        .send({ email: SEED_USER.email })
        .expect(400);
    });

    it('returns 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tokens')
        .send({ password: SEED_USER.password })
        .expect(400);
    });
  });
});
