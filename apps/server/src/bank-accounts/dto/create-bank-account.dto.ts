import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { IsInDatabase } from '../../validators/is-in-database.validator';
import { IsDutchIban } from '../../validators/is-dutch-iban.validator';
import { User } from '../../users/entities/user.entity';

export class CreateBankAccountDto {
  @ApiProperty({
    example: 'NL91ABNA0417164300',
    description: 'Valid Dutch IBAN',
  })
  @IsNotEmpty()
  @IsDutchIban()
  accountNumber: string;

  @ApiProperty({ example: 'My Checking Account' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsInDatabase(User)
  userId: string;
}
