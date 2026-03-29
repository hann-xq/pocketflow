import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'Weekly grocery shopping',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
