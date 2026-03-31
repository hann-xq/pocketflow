import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CategoryType } from '../enums/category-type.enum';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries', minLength: 2, maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    enum: CategoryType,
    example: CategoryType.EXPENSE,
    description:
      'Determines which transactions can use this category. ' +
      'Expense categories are for amounts <= 0; income categories are for amounts > 0. ' +
      'Cannot be changed after creation.',
  })
  @IsEnum(CategoryType)
  @IsNotEmpty()
  type: CategoryType;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'Weekly grocery shopping',
    minLength: 10,
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(200)
  description?: string;
}
