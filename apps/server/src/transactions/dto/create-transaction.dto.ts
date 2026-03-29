import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    required: false,
    nullable: true,
    example: 'Supermarket purchase',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: -42.5 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ required: false, nullable: true, example: 'Albert Heijn' })
  @IsString()
  @IsOptional()
  counterpartyName?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'NL91ABNA0417164300',
  })
  @IsString()
  @IsOptional()
  counterpartyAccount?: string;

  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ required: false, type: [String], format: 'uuid', example: [] })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  tagIds?: string[];
}
