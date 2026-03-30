import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CategoryType } from '../enums/category-type.enum';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries' })
  @IsString()
  @IsNotEmpty()
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
  })
  @IsString()
  @IsOptional()
  description?: string;
}
