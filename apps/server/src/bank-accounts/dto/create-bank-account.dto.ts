import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsDutchIban } from '../../validators/is-dutch-iban.validator';

export class CreateBankAccountDto {
  @ApiProperty({
    example: 'NL91ABNA0417164300',
    description: 'Valid Dutch IBAN',
  })
  @IsNotEmpty()
  @IsDutchIban()
  accountNumber: string;

  @ApiProperty({ example: 'My Checking Account', minLength: 2, maxLength: 60 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  accountName: string;
}
