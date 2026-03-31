import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainErrorCode } from '../exceptions/domain-error-code.enum';
import { DomainException } from '../exceptions/domain.exception';

const HTTP_STATUS: Record<DomainErrorCode, HttpStatus> = {
  [DomainErrorCode.NOT_AUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [DomainErrorCode.CONFLICT]: HttpStatus.CONFLICT,
  [DomainErrorCode.INVALID_REQUEST]: HttpStatus.BAD_REQUEST,
  [DomainErrorCode.EXTERNAL_SERVICE]: HttpStatus.BAD_GATEWAY,
};

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = HTTP_STATUS[exception.code];

    response.status(status).json({
      message: exception.message,
      error: exception.code,
    });
  }
}
