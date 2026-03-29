import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@ApiTags('Authentication')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a JWT access token' })
  @ApiOkResponse({ type: TokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  create(@Body() data: CreateTokenDto): Promise<TokenResponseDto> {
    return this.authService.login(data.email, data.password);
  }
}
