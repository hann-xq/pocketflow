import { DomainErrorCode } from './domain-error-code.enum';
import { DomainException } from './domain.exception';

export class NotAuthorizedException extends DomainException {
  constructor(message: string) {
    super(message, DomainErrorCode.NOT_AUTHORIZED);
  }
}
