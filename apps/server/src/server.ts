import { Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  INestApplication,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';

export function configureApp(app: INestApplication): void {
  app.useGlobalFilters(
    new DomainExceptionFilter(),
    new TypeOrmExceptionFilter(),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'abn-amro/authorize', method: RequestMethod.GET },
      { path: 'auth', method: RequestMethod.GET },
    ],
  });
}
