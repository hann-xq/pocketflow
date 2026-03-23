import {
  ClassSerializerInterceptor,
  INestApplication,
  ModuleMetadata,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { App } from 'supertest/types';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { TypeOrmExceptionFilter } from '../src/common/filters/typeorm-exception.filter';

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
  ];

  const module = await Test.createTestingModule({
    imports: imports ? [...defaultImports, ...imports] : defaultImports,
  }).compile();

  useContainer(module, { fallbackOnErrors: true });

  const app = module.createNestApplication();

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalFilters(
    new DomainExceptionFilter(),
    new TypeOrmExceptionFilter(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  await app.init();

  return app;
}
