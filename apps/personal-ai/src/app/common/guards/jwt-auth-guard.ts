import {Injectable, UnauthorizedException} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest(err: any, user: any, info: any, context: any, status: any) {
    if (err || !user) {
      console.log('❌ Auth Error Info:', info, context, status);
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
