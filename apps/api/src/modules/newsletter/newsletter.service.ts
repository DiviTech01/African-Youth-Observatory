import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscribeDto } from './newsletter.dto';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent: re-subscribing the same email is a no-op (status flipped back
   * to SUBSCRIBED if previously unsubscribed). Always returns ok so the form
   * UX stays simple — we don't tell the caller whether the email is new.
   */
  async subscribe(dto: SubscribeDto) {
    const email = dto.email.trim().toLowerCase();
    try {
      await this.prisma.newsletterSubscription.upsert({
        where: { email },
        create: {
          email,
          source: dto.source ?? null,
          status: 'SUBSCRIBED',
        },
        update: {
          status: 'SUBSCRIBED',
          unsubscribedAt: null,
          // keep the original source — it tells us what worked first
          source: undefined,
        },
      });
      return { ok: true };
    } catch (err) {
      this.logger.error(`newsletter subscribe failed for ${email}: ${(err as Error).message}`);
      return { ok: false, message: 'Subscription failed. Please try again later.' };
    }
  }
}
