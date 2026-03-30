import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '../enums/category-type.enum';

export class CategoryResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ example: 'Groceries' })
  name: string;

  @ApiProperty({
    nullable: true,
    example: 'groceries',
    description:
      'Stable lowercase key used to identify the category in code, independent of the display name.',
  })
  slug: string | null;

  @ApiProperty({ nullable: true, example: 'Weekly grocery shopping' })
  description: string | null;

  @ApiProperty({
    enum: CategoryType,
    example: CategoryType.EXPENSE,
    description:
      'Indicates whether this category applies to expenses (amounts <= 0) or income (amounts > 0).',
  })
  type: CategoryType;
}
