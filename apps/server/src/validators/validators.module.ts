import { Module } from '@nestjs/common';
import { IsInDatabaseConstraint } from './is-in-database.validator';
import { IsDutchIbanConstraint } from './is-dutch-iban.validator';

@Module({
  providers: [IsInDatabaseConstraint, IsDutchIbanConstraint],
  exports: [IsInDatabaseConstraint, IsDutchIbanConstraint],
})
export class ValidatorsModule {}
