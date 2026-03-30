import { DomainErrorCode } from './domain-error-code.enum';

export abstract class DomainException extends Error {
  protected constructor(
    message: string,
    readonly code: DomainErrorCode,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
