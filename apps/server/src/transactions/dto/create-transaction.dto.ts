import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIBAN,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsInDatabase } from '../../validators/is-in-database.validator';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';

export class CreateTransactionDto {
  @ApiProperty({
    required: false,
    nullable: true,
    example: 'Supermarket purchase',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: -42.5 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'Albert Heijn',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  counterpartyName?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'NL91ABNA0417164300',
  })
  @IsIBAN()
  @IsOptional()
  counterpartyAccount?: string;

  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsInDatabase(Category)
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ required: false, type: [String], format: 'uuid', example: [] })
  @IsArray()
  @IsInDatabase(Tag, 'id', { each: true })
  @IsOptional()
  tagIds?: string[];
}
