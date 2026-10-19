import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// The categories the mobile app knows about (ayo-mobile/lib/notifications.ts).
// Unknown keys are dropped and values coerced to booleans, so a client cannot
// store arbitrary JSON through a public endpoint.
const KNOWN_CATEGORIES = ['enabled', 'myCountry', 'favorites', 'reports', 'indexPolicyNews'];

function sanitizeCategories(input?: Record<string, unknown>): Record<string, boolean> | undefined {
  if (!input) return undefined;
  const out: Record<string, boolean> = {};
  for (const key of KNOWN_CATEGORIES) {
    if (key in input) out[key] = Boolean(input[key]);
  }
  return out;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Idempotent: re-registering the same token (every app start) just refreshes
   * lastSeenAt, so stale tokens can later be pruned by age. A token that was
   * registered anonymously is attached to the user once they sign in; it is
   * never detached by an anonymous re-register.
   */
  async register(input: {
    token: string;
    platform: string;
    categories?: Record<string, unknown>;
    userId: string | null;
  }) {
    const categories = sanitizeCategories(input.categories);
    const row = await this.prisma.pushToken.upsert({
      where: { token: input.token },
      create: {
        token: input.token,
        platform: input.platform,
        userId: input.userId,
        ...(categories ? { categories } : {}),
      },
      update: {
        platform: input.platform,
        lastSeenAt: new Date(),
        ...(input.userId ? { userId: input.userId } : {}),
        ...(categories ? { categories } : {}),
      },
      select: { id: true, platform: true, createdAt: true, lastSeenAt: true },
    });
    return { registered: true, ...row };
  }

  async unregister(token: string) {
    const { count } = await this.prisma.pushToken.deleteMany({ where: { token } });
    return { unregistered: count > 0 };
  }
}
