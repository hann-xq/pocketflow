import { DomainErrorCode } from './domain-error-code.enum';
import { DomainException } from './domain.exception';

export class InvalidRequestException extends DomainException {
  constructor(message: string) {
    super(message, DomainErrorCode.INVALID_REQUEST);
  }
}
