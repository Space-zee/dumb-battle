import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async generateJwt(telegramUserId: number) {
    const payload = { telegramUserId };
    const expiresIn = '60m';
    return this.jwtService.sign(payload, { expiresIn });
  }
}
