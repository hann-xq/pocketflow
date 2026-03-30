import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class InvalidRequestException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
