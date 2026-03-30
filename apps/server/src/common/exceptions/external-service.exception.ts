import { DomainErrorCode } from './domain-error-code.enum';
import { DomainException } from './domain.exception';

export class ExternalServiceException extends DomainException {
  constructor(message: string) {
    super(message, DomainErrorCode.EXTERNAL_SERVICE);
  }
}
