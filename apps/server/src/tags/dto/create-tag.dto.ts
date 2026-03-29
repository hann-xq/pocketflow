import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    example: 'essential',
    maxLength: 50,
    pattern: '^[a-zA-Z0-9._-]+$',
    description:
      'Tag name. Alphanumeric characters, hyphens, underscores, and dots only. Max 50 characters.',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'name may only contain alphanumeric characters, hyphens, underscores, and dots',
  })
  name: string;
}
