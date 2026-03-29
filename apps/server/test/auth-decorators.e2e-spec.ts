import request from 'supertest';
import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp, getToken } from './test-utils';
import { Auth } from '../src/auth/decorators/auth.decorator';
import { CurrentUser } from '../src/auth/decorators/current-user.decorator';
import { User } from '../src/users/entities/user.entity';
import { SeederService } from '../src/seeds/seeder.service';
import { SEED_USER } from '../src/seeds/seed-data';

// Isolated mock controller used only in this test to verify the decorators.
@Controller('test')
class TestController {
  @Get('protected')
  @Auth()
  getProtected(@CurrentUser() user: User) {
    return { id: user.id, email: user.email };
  }
}

@Module({ controllers: [TestController] })
class TestModule {}

describe('@Auth() and @CurrentUser() (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp([TestModule]);
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    await app.get(SeederService).run();
    token = await getToken(app);
  });

  describe('@Auth()', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test/protected')
        .expect(401);
    });

    it('returns 401 for a malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test/protected')
        .set('Authorization', 'Bearer not.a.valid.jwt')
        .expect(401);
    });

    it('allows access with a valid JWT', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('@CurrentUser()', () => {
    it('injects the authenticated user into the route handler', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe(SEED_USER.email);
      expect(res.body.id).toBeDefined();
    });
  });
});
