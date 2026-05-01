import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { DEFAULT_AGE_GROUP } from '../shared/constants';

/**
 * IndicatorValue queries on this platform must default to the AU 15-35
 * youth band unless the caller explicitly passes a different ageGroup.
 * Without this guarantee we end up mixing 15-24 (UN) leftovers with 15-35
 * AYIMS data and every aggregate reads wrong (Key Statistics, Themes
 * totals, Compare rankings, Youth Index, country profile, etc.).
 *
 * Rather than hand-patch every call site across 30+ files (and rely on
 * remembering to do it for every new module), we install a Prisma client
 * middleware here that injects `ageGroup: DEFAULT_AGE_GROUP` into every
 * read on IndicatorValue when the caller hasn't explicitly set one.
 *
 * Writes (create / upsert / update / delete) are NEVER auto-filtered —
 * upload pipelines need to write rows with whatever ageGroup the source
 * dictates (e.g. AYIMS columns at 18-30, 18-35, 15-35).
 *
 * Callers that genuinely want to query a different age band (admin tools,
 * custom reports) just pass `where: { ageGroup: '15-24' }` or set the
 * `_skipAgeGroupDefault: true` flag at the top level of their where —
 * the middleware respects it.
 */
const READ_ACTIONS: Prisma.PrismaAction[] = ['findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow', 'findMany', 'count', 'aggregate', 'groupBy'];

function applyAgeGroupDefault(where: any): any {
  if (!where || typeof where !== 'object') {
    return { ageGroup: DEFAULT_AGE_GROUP };
  }
  // Caller opted out
  if (where._skipAgeGroupDefault) {
    const { _skipAgeGroupDefault, ...rest } = where;
    return rest;
  }
  // Caller already constrained ageGroup (any shape: equals, in, not, etc.)
  if ('ageGroup' in where) return where;
  // OR / AND / NOT branches with explicit ageGroup also count as "caller set it"
  // but we don't recurse — the simple default-when-missing is enough for the
  // 99% case and avoids surprising override semantics.
  return { ...where, ageGroup: DEFAULT_AGE_GROUP };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  constructor() {
    super();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    this.$use(async (params, next) => {
      if (params.model !== 'IndicatorValue') return next(params);
      if (!READ_ACTIONS.includes(params.action)) return next(params);
      // Patch params.args.where to default ageGroup when missing.
      const args = (params.args ?? {}) as Record<string, any>;
      args.where = applyAgeGroupDefault(args.where);
      params.args = args;
      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(`IndicatorValue reads default to ageGroup="${DEFAULT_AGE_GROUP}" (override with _skipAgeGroupDefault: true on the where clause).`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
