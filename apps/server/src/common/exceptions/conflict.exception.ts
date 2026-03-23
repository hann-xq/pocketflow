import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class EntityConflictException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}
