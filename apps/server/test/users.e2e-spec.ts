import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp, getToken } from './test-utils';
import { UsersModule } from '../src/users/users.module';
import { UsersService } from '../src/users/users.service';
import { SeederService } from '../src/seeds/seeder.service';
import { SEED_USER } from '../src/seeds/seed-data';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp([UsersModule]);
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
  });

  describe('POST /api/v1/users', () => {
    it('creates a user and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          password: SEED_USER.password,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.password).not.toBe(SEED_USER.password);
    });

    it('does not expose the password in the response', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          password: SEED_USER.password,
        })
        .expect(201);

      expect(res.body.password).toBeUndefined();
    });

    it('returns 409 for duplicate email', async () => {
      // SEED_USER.email is already seeded — no setup needed
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: SEED_USER.email,
          firstName: SEED_USER.firstName,
          lastName: SEED_USER.lastName,
          password: SEED_USER.password,
        })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('returns 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'not-an-email',
          firstName: 'Jane',
          lastName: 'Smith',
          password: SEED_USER.password,
        })
        .expect(400);
    });

    it('returns 400 for password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          password: 'short',
        })
        .expect(400);
    });

    it('returns 400 for unknown fields (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          password: SEED_USER.password,
          role: 'admin',
        })
        .expect(400);
    });

    it('returns 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          password: SEED_USER.password,
        })
        .expect(400);
    });

    it('returns 400 when firstName is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'new@example.com',
          lastName: 'Smith',
          password: SEED_USER.password,
        })
        .expect(400);
    });

    it('returns 400 when lastName is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'new@example.com',
          firstName: 'Jane',
          password: SEED_USER.password,
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/users', () => {
    it('returns all users', async () => {
      // One seeded user already present; add one more to verify the full list is returned
      await request(app.getHttpServer()).post('/api/v1/users').send({
        email: 'extra@example.com',
        firstName: 'Extra',
        lastName: 'User',
        password: SEED_USER.password,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.map((u: any) => u.email)).toEqual(
        expect.arrayContaining([SEED_USER.email, 'extra@example.com']),
      );
    });

    it('does not expose passwords in the response', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      res.body.forEach((u: any) => expect(u.password).toBeUndefined());
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('returns the user for a valid id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        email: SEED_USER.email,
        firstName: SEED_USER.firstName,
        lastName: SEED_USER.lastName,
      });
    });

    it('does not expose the password in the response', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.password).toBeUndefined();
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/abc')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('updates the user email', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'after@example.com' })
        .expect(200);

      expect(res.body.email).toBe('after@example.com');
    });

    it('updates the first name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(res.body.firstName).toBe('Updated');
    });

    it('updates the last name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ lastName: 'Updated' })
        .expect(200);

      expect(res.body.lastName).toBe('Updated');
    });

    it('hashes the password on update', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'newpassword123' })
        .expect(200);

      expect(res.body.password).not.toBe('newpassword123');
    });

    it('does not expose the password in the response', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'updated@example.com' })
        .expect(200);

      expect(res.body.password).toBeUndefined();
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'x@example.com' })
        .expect(404);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .send({ email: 'after@example.com' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('deletes the user and returns 204', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      // After deletion the JWT strategy cannot load the user, so the
      // guard propagates EntityNotFoundError -> 404 (TypeOrmExceptionFilter).
      await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 404 for a non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .expect(401);
    });
  });
});
