import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class TransactionResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ example: -42.5 })
  amount: number;

  @ApiProperty({ example: '2024-01-15' })
  date: string;

  @ApiProperty({ nullable: true, example: 'Albert Heijn' })
  counterpartyName: string | null;

  @ApiProperty({ nullable: true, example: 'NL91ABNA0417164300' })
  counterpartyAccount: string | null;

  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId: string;

  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  bankAccountId: string;

  @ApiProperty({ type: () => CategoryResponseDto })
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;

  @ApiProperty({ type: () => [TagResponseDto] })
  @Type(() => TagResponseDto)
  tags: TagResponseDto[];
}
