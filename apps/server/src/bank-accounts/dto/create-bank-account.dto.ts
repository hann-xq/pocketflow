import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { IsInDatabase } from '../../validators/is-in-database.validator';
import { IsDutchIban } from '../../validators/is-dutch-iban.validator';
import { User } from '../../users/entities/user.entity';

export class CreateBankAccountDto {
  @IsNotEmpty()
  @IsDutchIban()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsUUID()
  @IsInDatabase(User)
  userId: string;
}
