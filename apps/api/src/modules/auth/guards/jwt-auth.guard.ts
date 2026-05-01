import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    if (err || !user) {
      // Surface the underlying passport-jwt failure reason so we can tell apart
      // expired-token, bad-signature, missing-token, etc. info.message comes from
      // jsonwebtoken (e.g. "jwt expired", "invalid signature", "No auth token").
      const reason = info?.message || err?.message || 'no token / no user';
      const req = context.switchToHttp().getRequest();
      console.warn(`[JwtAuthGuard] 401 on ${req.method} ${req.url} — ${reason}`);
      throw new UnauthorizedException({ message: `Unauthorized: ${reason}`, statusCode: 401 });
    }
    return user;
  }
}
