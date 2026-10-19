import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { DEFAULT_AGE_GROUP } from '../shared/constants';

/**
 * IndicatorValue reads default to each indicator's CANONICAL age band unless
 * the caller explicitly passes a different ageGroup.
 *
 * History: this middleware used to inject a blanket `ageGroup: '15-35'`. That
 * kept 15-24 (UN) leftovers out of AU 15-35 aggregates, but it also made every
 * indicator stored under another band invisible: 9,474 rows (18.2% of the
 * database) under 18-30 / 18-35 / 'all' / '' -- all of Peace & Security, most
 * of Access to Justice, total-population and the 24 ayc-* policy markers
 * (audit C5).
 *
 * Every indicator is currently stored under exactly one band, so the canonical
 * band is simply "the band this indicator's rows use": 15-35 when it has any
 * 15-35 rows, otherwise whichever band holds the most rows. Mixing is still
 * impossible -- one band per indicator -- but nothing is hidden any more. The
 * band actually read rides on each row (`ageGroup`), so callers can surface it.
 *
 * Semantics of the where clause:
 *   - no ageGroup (or undefined) -> canonical band per indicator
 *   - ageGroup === '15-35'      -> canonical band per indicator. Every call
 *     site that passes DEFAULT_AGE_GROUP means "the platform default", and for
 *     every indicator that has 15-35 rows the result is identical.
 *   - any other ageGroup shape  -> respected as-is
 *   - `_skipAgeGroupDefault: true` -> no age filter at all
 *
 * Unique lookups (findUnique*) are never filtered: they identify one row.
 * Writes (create / upsert / update / delete) are NEVER filtered.
 */
const READ_ACTIONS: Prisma.PrismaAction[] = ['findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy'];

/** How long the indicator -> band map is trusted before it is re-read. */
const BAND_TTL_MS = 10 * 60 * 1000;

interface BandMap {
  loadedAt: number;
  /** indicatorId -> canonical band, for indicators whose band is NOT the default. */
  nonDefault: Map<string, string>;
  /** The where fragment that selects every indicator's canonical band. */
  clause: Prisma.IndicatorValueWhereInput;
}

function buildClause(nonDefault: Map<string, string>): Prisma.IndicatorValueWhereInput {
  if (nonDefault.size === 0) return { ageGroup: DEFAULT_AGE_GROUP };
  const byBand = new Map<string, string[]>();
  for (const [id, band] of nonDefault) {
    const ids = byBand.get(band) ?? [];
    ids.push(id);
    byBand.set(band, ids);
  }
  return {
    OR: [
      { ageGroup: DEFAULT_AGE_GROUP, indicatorId: { notIn: [...nonDefault.keys()] } },
      ...[...byBand.entries()].map(([band, ids]) => ({ ageGroup: band, indicatorId: { in: ids } })),
    ],
  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');
  private bands: BandMap | null = null;
  private bandsLoading: Promise<BandMap> | null = null;

  constructor() {
    super();

    this.$use(async (params, next) => {
      if (params.model !== 'IndicatorValue') return next(params);
      if (!READ_ACTIONS.includes(params.action)) return next(params);
      const args = (params.args ?? {}) as Record<string, any>;
      args.where = await this.applyAgeGroupDefault(args.where);
      params.args = args;
      return next(params);
    });
  }

  private async applyAgeGroupDefault(where: any): Promise<any> {
    if (where && typeof where === 'object' && '_skipAgeGroupDefault' in where) {
      // Always strip the flag (Prisma rejects unknown keys); honour it only when true.
      const { _skipAgeGroupDefault, ...rest } = where;
      if (_skipAgeGroupDefault) return rest;
      where = rest;
    }
    const hasWhere = where && typeof where === 'object';
    // An explicit band other than the platform default is the caller's choice.
    // (`ageGroup: undefined` counts as "not set", same as a missing key.)
    if (hasWhere && where.ageGroup !== undefined && where.ageGroup !== DEFAULT_AGE_GROUP) return where;

    const { clause } = await this.loadBands();
    if (!hasWhere) return clause;
    const { ageGroup: _ignored, ...rest } = where;
    return Object.keys(rest).length ? { AND: [rest, clause] } : clause;
  }

  private async loadBands(): Promise<BandMap> {
    if (this.bands && Date.now() - this.bands.loadedAt < BAND_TTL_MS) return this.bands;
    if (this.bandsLoading) return this.bandsLoading;
    this.bandsLoading = (async () => {
      try {
        const groups = await this.indicatorValue.groupBy({
          by: ['indicatorId', 'ageGroup'],
          // Unfiltered: this query is what the filter is built from.
          where: { _skipAgeGroupDefault: true } as any,
          _count: { _all: true },
        });
        const best = new Map<string, { band: string; n: number; hasDefault: boolean }>();
        for (const g of groups) {
          const cur = best.get(g.indicatorId) ?? { band: g.ageGroup, n: -1, hasDefault: false };
          if (g.ageGroup === DEFAULT_AGE_GROUP) cur.hasDefault = true;
          if (g._count._all > cur.n) {
            cur.band = g.ageGroup;
            cur.n = g._count._all;
          }
          best.set(g.indicatorId, cur);
        }
        const nonDefault = new Map<string, string>();
        for (const [id, b] of best) {
          if (!b.hasDefault && b.band !== DEFAULT_AGE_GROUP) nonDefault.set(id, b.band);
        }
        this.bands = { loadedAt: Date.now(), nonDefault, clause: buildClause(nonDefault) };
        return this.bands;
      } catch (err) {
        // Never take reads down over the band map: fall back to the old blanket
        // default and retry on the next read.
        this.logger.warn(`Age-band map failed to load (${(err as Error).message}); using "${DEFAULT_AGE_GROUP}" for now.`);
        return { loadedAt: 0, nonDefault: new Map(), clause: { ageGroup: DEFAULT_AGE_GROUP } };
      } finally {
        this.bandsLoading = null;
      }
    })();
    return this.bandsLoading;
  }

  /** The canonical band for one indicator (the band its rows are read from). */
  async canonicalAgeGroup(indicatorId: string): Promise<string> {
    const { nonDefault } = await this.loadBands();
    return nonDefault.get(indicatorId) ?? DEFAULT_AGE_GROUP;
  }

  /** Call after any bulk write that could add a new indicator or band. */
  invalidateAgeBands(): void {
    this.bands = null;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(`IndicatorValue reads default to each indicator's canonical age band (override with an explicit ageGroup or _skipAgeGroupDefault: true).`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
