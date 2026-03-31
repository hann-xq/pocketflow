import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundError, EntitySchema } from 'typeorm';

@Catch(EntityNotFoundError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const { entityClass } = exception;
    let name: string;
    if (entityClass instanceof EntitySchema) {
      name = entityClass.options.name;
    } else if (typeof entityClass === 'string') {
      name = entityClass;
    } else {
      name = entityClass.name;
    }
    const message = `${name} not found.`;

    response.status(HttpStatus.NOT_FOUND).json({
      message,
      error: exception.name,
    });
  }
}
