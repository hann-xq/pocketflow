import { HttpStatus } from '@nestjs/common';

export abstract class DomainException extends Error {
  protected constructor(
    message: string,
    readonly httpStatus: HttpStatus,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
