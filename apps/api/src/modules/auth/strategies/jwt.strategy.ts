import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../auth.service';

interface JwtPayload {
  sub: string;
  email: string;
  user_metadata?: { name?: string };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    const existing = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });

    if (existing) return existing;

    // First-time login — provision and send welcome email
    const name = payload.user_metadata?.name ?? undefined;
    const user = await this.prisma.user.create({
      data: {
        id: payload.sub,
        email: payload.email,
        name,
        role: 'REGISTERED',
      },
      select: { id: true, email: true, name: true, role: true },
    });

    this.authService.onNewUserProvisioned({
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
    });

    return user;
  }
}
