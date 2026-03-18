import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SignUpDto, SignInDto } from './auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private hashPassword(password: string): string {
    // NOTE: In production, use bcrypt or argon2. This is a placeholder.
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async signUp(dto: SignUpDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: this.hashPassword(dto.password),
        organization: dto.organization,
        role: 'REGISTERED',
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.passwordHash !== this.hashPassword(dto.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // TODO: Return JWT token when @nestjs/jwt is added
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      message: 'Sign in successful. JWT integration pending.',
    };
  }
}
