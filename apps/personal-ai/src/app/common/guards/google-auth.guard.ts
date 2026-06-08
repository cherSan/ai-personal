import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAdminGuard implements CanActivate {
  private client = new OAuth2Client();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid Authorization Header');
    }

    const idToken = authHeader.split(' ')[1];

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: idToken,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid token Google');
      }
      const allowedEmail = process.env.APP_EMAIL;

      if (payload.email !== allowedEmail || !payload.email_verified) {
        throw new ForbiddenException('No email verified');
      }
      request.user = payload;
      return true;

    } catch (error: any) {
      throw new UnauthorizedException(error?.message || 'Token Google');
    }
  }
}
