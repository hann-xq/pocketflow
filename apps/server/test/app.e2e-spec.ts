import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './test-utils';
import { UsersModule } from '../src/users/users.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp([UsersModule]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 404 for the root path (global prefix is /api)', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  it('returns 404 for unknown routes under /api', () => {
    return request(app.getHttpServer()).get('/api/unknown-route').expect(404);
  });

  it('rejects requests with extra body fields (global validation pipe)', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send({
        email: 'test@example.com',
        password: 'password123',
        injected: true,
      })
      .expect(400);
  });
});
