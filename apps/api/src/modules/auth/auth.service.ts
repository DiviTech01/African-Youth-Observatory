import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UpdateProfileDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { dashboards: true } } },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() || null,
      dashboardCount: user._count.dashboards,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.organization !== undefined) data.organization = dto.organization;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization,
      avatar: user.avatar,
    };
  }

  async submitContact(data: {
    name: string;
    email: string;
    organization?: string;
    inquiryType: string;
    subject: string;
    message: string;
  }) {
    await Promise.all([
      this.mail.sendContactConfirmation(data.email, data.name, data.subject),
      this.mail.sendContactToAdmin(data),
    ]);

    return { message: 'Your message has been sent. We will respond within 2-3 business days.' };
  }

  async onNewUserProvisioned(user: { id: string; email: string; name?: string; role: string }) {
    Promise.all([
      this.mail.sendWelcome(user.email, user.name),
      this.mail.sendNewUserNotification(user),
    ]).catch((e) => {
      this.logger.warn(`Welcome/notify email failed for ${user.email}: ${e}`);
    });
  }
}
