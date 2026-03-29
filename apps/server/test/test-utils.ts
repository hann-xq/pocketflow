import request from 'supertest';
import { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { App } from 'supertest/types';
import { configureApp } from '../src/server';
import { ValidatorsModule } from '../src/validators/validators.module';
import { SeederModule } from '../src/seeds/seeder.module';
import { AuthModule } from '../src/auth/auth.module';
import { SEED_USER } from '../src/seeds/seed-data';

export async function createTestApp(
  imports?: ModuleMetadata['imports'],
): Promise<INestApplication<App>> {
  const defaultImports = [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    }),
    AuthModule,
    SeederModule,
    ValidatorsModule,
  ];

  const module = await Test.createTestingModule({
    imports: imports ? [...defaultImports, ...imports] : defaultImports,
  }).compile();

  useContainer(module, { fallbackOnErrors: true });

  const app = module.createNestApplication();

  configureApp(app);

  await app.init();

  return app;
}

export async function getToken(
  app: INestApplication<App>,
  email = SEED_USER.email,
  password = SEED_USER.password,
): Promise<string> {
  const { body } = await request(app.getHttpServer())
    .post('/api/v1/tokens')
    .send({ email, password });

  return body.accessToken as string;
}
