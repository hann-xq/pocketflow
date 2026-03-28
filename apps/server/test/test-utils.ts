import { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { App } from 'supertest/types';
import { configureApp } from '../src/server';
import { ValidatorsModule } from '../src/validators/validators.module';
import { SeederModule } from '../src/seeds/seeder.module';

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
