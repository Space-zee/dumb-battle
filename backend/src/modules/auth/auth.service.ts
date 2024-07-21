import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateJwt(telegramUserId: number) {
    const payload = { telegramUserId };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '60m';
    return this.jwtService.sign(payload, { expiresIn });
  }
}
