import { ApiProperty } from '@nestjs/swagger';

export class AbnAmroCallbackResponseDto {
  @ApiProperty({
    example: 'Authorization successful. You may now sync transactions.',
  })
  message: string;

  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiJ9...' })
  accessToken: string;
}
