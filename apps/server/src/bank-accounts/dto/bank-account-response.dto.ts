import { ApiProperty } from '@nestjs/swagger';
import { ExternalConnectionType } from '../enums/external-connection-type.enum';

export class BankAccountResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ example: 'NL91ABNA0417164300' })
  accountNumber: string;

  @ApiProperty({ example: 'My Checking Account' })
  accountName: string;

  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    enum: ExternalConnectionType,
    nullable: true,
    example: ExternalConnectionType.AbnAmro,
  })
  connectionType: ExternalConnectionType | null;
}
