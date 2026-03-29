import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'essential' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
