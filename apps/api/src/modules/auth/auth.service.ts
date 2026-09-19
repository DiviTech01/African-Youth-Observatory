import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
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

  /**
   * Deletes the signed-in user's own account and their personal data.
   *
   * Required rather than optional: Google Play mandates that an app offering
   * account creation also offer in-app deletion and a web URL for it, and the
   * only delete that existed was admin-only. The Privacy Policy now promises
   * this, so it has to actually work.
   *
   * Two-part deletion, and the order matters. Application rows go first inside a
   * transaction; the Supabase auth identity goes last, because a credential left
   * behind with no application row would silently re-provision a fresh empty
   * account on the user's next sign-in, and they would reasonably conclude their
   * deletion had been ignored.
   */
  async deleteOwnAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Account not found');

    // The same guard the admin path uses. An organisation that deletes its way
    // to zero admins locks itself out of its own CMS with no recovery in the UI.
    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'You are the only administrator. Promote another administrator before deleting this account, or contact support.',
        );
      }
    }

    // Refuse rather than half-delete: if the credential cannot be removed, the
    // account is not deleted in any sense the user or Play would accept. The
    // message has to give them a path that does work.
    if (!this.supabaseAdminConfigured()) {
      this.logger.error(
        'Account deletion attempted without SUPABASE_SERVICE_ROLE_KEY — the sign-in credential cannot be removed, so nothing was deleted.',
      );
      throw new ServiceUnavailableException(
        'Account deletion is temporarily unavailable. Please email privacy@africanyouthobservatory.org and we will delete your account within 30 days.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Dashboards hold a required relation to User, so the FK is RESTRICT and
      // the user row cannot go until these do.
      await tx.dashboard.deleteMany({ where: { userId } });

      // The subscription is keyed by email, not by user id, so it would survive
      // the account and keep mailing someone who asked to be forgotten.
      await tx.newsletterSubscription.deleteMany({ where: { email: user.email } });

      // Authorship on content, documents and upload audits is an optional
      // relation, so deleting the user nulls it. The rows stay — they are the
      // provenance record for published data — but they stop naming a person.
      await tx.user.delete({ where: { id: userId } });
    });

    await this.deleteSupabaseIdentity(userId);

    this.logger.log(`Account ${userId} deleted at the account holder's request`);
    return {
      deleted: true,
      message: 'Your account and personal data have been deleted.',
    };
  }

  private supabaseAdminConfigured(): boolean {
    return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  }

  /**
   * Removes the Supabase auth user via the Admin API.
   *
   * Throws on failure. The application rows are already gone by this point, so a
   * silent failure here is the worst outcome available: the user would be told
   * they were deleted while a working credential remained. Surfacing the error
   * gets it into the logs and gives the caller something true to show.
   */
  private async deleteSupabaseIdentity(userId: string): Promise<void> {
    const base = process.env.SUPABASE_URL!.replace(/\/+$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const res = await fetch(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });

    // 404 means the identity is already gone — the desired end state.
    if (!res.ok && res.status !== 404) {
      const detail = await res.text().catch(() => '');
      this.logger.error(
        `Supabase identity ${userId} was NOT deleted (HTTP ${res.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Your data was removed but your sign-in credential could not be deleted. Please email privacy@africanyouthobservatory.org so we can finish the job.',
      );
    }
  }

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
