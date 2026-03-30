import { DomainErrorCode } from './domain-error-code.enum';
import { DomainException } from './domain.exception';

export class EntityConflictException extends DomainException {
  constructor(message: string) {
    super(message, DomainErrorCode.CONFLICT);
  }
}
