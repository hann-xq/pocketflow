import { ApiProperty } from '@nestjs/swagger';

export class AbnAmroAuthorizationResponseDto {
  @ApiProperty({
    example:
      'https://auth-sandbox.abnamro.com/as/authorization.oauth2?response_type=code&...',
  })
  authorizationUrl: string;
}
