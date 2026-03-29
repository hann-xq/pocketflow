import { ApiProperty } from '@nestjs/swagger';

export class AbnAmroSyncResponseDto {
  @ApiProperty({ example: 42 })
  imported: number;

  @ApiProperty({ type: [String], example: [] })
  errors: string[];
}
