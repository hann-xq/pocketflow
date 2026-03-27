import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateBankAccountDto } from './create-bank-account.dto';

export class UpdateBankAccountDto extends PartialType(
  OmitType(CreateBankAccountDto, ['userId', 'accountNumber'] as const),
) {}
