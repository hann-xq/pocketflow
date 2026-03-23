import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class NotAuthorizedException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
