import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const token = this.extractToken(client);

    try {
      const payload = this.verifyToken(token);
      
      client.user = payload;

      return true;
    } catch (error) {
      console.error('JWT verification error:', error); // Improved error logging
      throw new UnauthorizedException('Unauthorized');
    }
  }

  private extractToken(client: any): string {
    const token = client.handshake.auth?.token;
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    return token;
  }

  private verifyToken(token: string): any {
    return jwt.verify(token, this.configService.get<string>('JWT_SECRET'));
  }
}
