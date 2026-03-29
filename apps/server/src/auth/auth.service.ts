import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotAuthorizedException } from '../common/exceptions/not-authorized.exception';
import { UsersService } from '../users/users.service';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<TokenResponseDto> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new NotAuthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }
}
