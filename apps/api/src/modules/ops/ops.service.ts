import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { AiService, type AiSurface } from '../insights/ai.service';
import { R2Service } from '../content/r2.service';
import { MailService } from '../mail/mail.service';
import { DEFAULT_AGE_GROUP } from '../../shared/constants';

const PUBLIC_SITE = 'https://africanyouthobservatory.org';

type AiHealth = {
  ok: boolean;
  model: string;
  error: string | null;
  // How the answer was reached. Only 'probe', 'cached-probe' and
  // 'recent-traffic' are evidence that Anthropic actually answers; 'config'
  // just means a key is set.
  checkedBy: 'probe' | 'cached-probe' | 'recent-traffic' | 'config';
  verified: boolean;
  checkedAt: string | null;
};

type ComponentCheck = { ok: boolean; configured: boolean; latencyMs: number | null; detail: string };

/** Plain GET with a hard timeout; never rejects. */
function httpGet(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 8000,
): Promise<{ status: number | null; body: string; latencyMs: number; error?: string }> {
  const started = Date.now();
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET', timeout: timeoutMs, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? null,
          body: Buffer.concat(chunks).toString('utf8').slice(0, 20_000),
          latencyMs: Date.now() - started,
        }),
      );
    });
    req.on('timeout', () => req.destroy(new Error(`timed out after ${timeoutMs / 1000} seconds`)));
    req.on('error', (err) =>
      resolve({ status: null, body: '', latencyMs: Date.now() - started, error: err.message }),
    );
    req.end();
  });
}

/**
 * Operator-facing rollups for the AYO platform.
 *
 * Everything here is read-only and shaped for a single spoken answer: one
 * `summary` sentence, plus a `problems` array written in plain language. The
 * consumer (B.I.L.L.I.E.) reads these to a human, so no field in this module
 * may ever contain a stack trace, a bare status code, or a Prisma error.
 */
@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);
  private startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private ai: AiService,
    private r2: R2Service,
    private mail: MailService,
  ) {}

  // ── Status: "is the site up / what's broken" ─────────────────

  /**
   * `deep` = run the paid 1-token Anthropic probe (still cached 10 min / 60 s by
   * AiService.probe). Without it, AI health comes from free signals only — the
   * last real call's outcome, a cached probe, or failing those the config — so
   * a status poll never spends money. Every other check here is free.
   */
  async getStatus(opts: { deep?: boolean } = {}) {
    const deep = Boolean(opts.deep);
    // Chat and reports are checked as separate surfaces, since each can be
    // pointed at a different model by env — one can be reachable while the
    // other is not.
    const [database, website, ai, aiReport, storage, email, auth] = await Promise.all([
      this.checkDatabase(),
      this.checkPublicSite(),
      this.aiHealth('chat', deep),
      this.aiHealth('report', deep),
      this.checkStorage(),
      this.checkEmail(),
      this.checkAuth(),
    ]);

    const dataFreshness = database.connected
      ? await this.checkDataFreshness()
      : { latestDataYear: null as number | null, lastIngestedAt: null as string | null, stale: false };

    // Problems are ordered by how much they matter to a person asking
    // "what's broken?" — data outage first, then public site, then AI.
    const problems: string[] = [];
    if (!database.connected) {
      problems.push(
        'The database is unreachable, so no data, rankings or user numbers can be served. This takes the whole platform down.',
      );
    }
    if (!website.reachable) {
      problems.push(
        `The public site at africanyouthobservatory.org is not responding (${website.detail}). Visitors cannot load it.`,
      );
    }
    // A billing or API-key fault takes out both surfaces at once. Report that
    // as one problem rather than reading the same fault out twice.
    if (!ai.ok && !aiReport.ok) {
      problems.push(
        ai.error === aiReport.error
          ? `AI is degraded across both chat and reports. ${ai.error}`
          : `AI chat is degraded (${ai.error}) and report generation is degraded (${aiReport.error}).`,
      );
    } else if (!ai.ok) {
      problems.push(`AI chat answers are degraded. ${ai.error}`);
    } else if (!aiReport.ok) {
      problems.push(`AI report generation is degraded. ${aiReport.error}`);
    }
    if (!auth.ok) {
      problems.push(
        `Sign-in is not working: ${auth.detail} Nobody can sign up or log in until it recovers.`,
      );
    }
    if (!storage.ok) {
      problems.push(
        `File storage is not working: ${storage.detail} Document downloads, uploads and saved reports will fail.`,
      );
    }
    if (!email.ok) {
      problems.push(
        `Email sending is not working: ${email.detail} Welcome emails, newsletters and admin notices will not go out.`,
      );
    }
    // Once the daily ceiling is hit, every AI answer silently becomes rule-based.
    // That is the designed degradation, but an operator must be told, because the
    // symptom otherwise looks like the model getting worse.
    const budget = await this.ai.budgetSnapshot();
    if (!budget.ledgerReachable) {
      problems.push(
        'The AI spend ledger cannot be read, so every AI call is being refused and answers fall back to the rule-based engine.',
      );
    } else if (budget.exhausted) {
      problems.push(
        `The daily AI budget of $${budget.budgetUsd} is spent, so AI answers and reports are falling back to the rule-based engine until ${budget.day} rolls over. ${budget.rejectedCalls} call(s) refused.`,
      );
    }
    if (dataFreshness.stale) {
      problems.push(
        `No new data has been ingested since ${dataFreshness.lastIngestedAt}. The numbers are still served, but they are going stale.`,
      );
    }

    // A dead database or a dead public site is "down". Anything else that is
    // wrong is "degraded" — the platform still answers, just not fully.
    const status = !database.connected || !website.reachable
      ? 'down'
      : problems.length > 0
        ? 'degraded'
        : 'ok';

    return {
      status,
      summary: this.buildSummary(status, problems),
      problems,
      checkedAt: new Date().toISOString(),
      components: {
        api: {
          up: true,
          uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
          version: '1.0.0',
        },
        database,
        website,
        // ok/model/error stay top-level for the shape the manifest documents;
        // the per-surface detail is additive.
        ai: {
          ok: ai.ok && aiReport.ok,
          model: ai.model,
          error: ai.error ?? aiReport.error,
          // false = nothing has proved Anthropic answers yet (no probe, no real
          // call since boot). Pass ?deep=1 to force a probe.
          verified: ai.verified && aiReport.verified,
          chat: ai,
          reports: aiReport,
          budget,
        },
        auth,
        storage,
        email,
      },
      data: dataFreshness,
      deep,
    };
  }

  private buildSummary(status: string, problems: string[]): string {
    if (status === 'ok') return 'African Youth Observatory is fully up. Nothing is broken.';
    if (problems.length === 1) return problems[0];
    return `${problems.length} things need attention. ${problems[0]}`;
  }

  private async checkDatabase(): Promise<{
    connected: boolean;
    latencyMs: number | null;
    detail: string;
  }> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - started;
      return { connected: true, latencyMs, detail: `Responded in ${latencyMs}ms.` };
    } catch (err: unknown) {
      this.logger.error(`Database check failed: ${err instanceof Error ? err.message : err}`);
      return {
        connected: false,
        latencyMs: null,
        detail: 'The database did not respond to a test query.',
      };
    }
  }

  /**
   * "Is the site up" means the public front-end, not just this API — the API
   * answering is not evidence that visitors can load anything. Cached for 60s
   * so repeated voice queries don't hammer the front-end.
   */
  private async checkPublicSite(): Promise<{
    url: string;
    reachable: boolean;
    httpStatus: number | null;
    latencyMs: number | null;
    detail: string;
  }> {
    const cacheKey = 'ops:public-site';
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const started = Date.now();
    const result = await new Promise<{
      url: string;
      reachable: boolean;
      httpStatus: number | null;
      latencyMs: number | null;
      detail: string;
    }>((resolve) => {
      const req = https.request(
        PUBLIC_SITE,
        { method: 'GET', timeout: 10_000, headers: { 'User-Agent': 'AYO-ops-check' } },
        (res) => {
          res.resume(); // drain, we only care about the status line
          const code = res.statusCode ?? 0;
          const latencyMs = Date.now() - started;
          // 2xx and 3xx both mean a visitor gets somewhere useful.
          const reachable = code >= 200 && code < 400;
          resolve({
            url: PUBLIC_SITE,
            reachable,
            httpStatus: code,
            latencyMs,
            detail: reachable
              ? `Responded ${code} in ${latencyMs}ms.`
              : `returned HTTP ${code}`,
          });
        },
      );
      req.on('timeout', () => {
        req.destroy();
        resolve({
          url: PUBLIC_SITE,
          reachable: false,
          httpStatus: null,
          latencyMs: null,
          detail: 'it timed out after 10 seconds',
        });
      });
      req.on('error', (err) => {
        resolve({
          url: PUBLIC_SITE,
          reachable: false,
          httpStatus: null,
          latencyMs: null,
          detail: `the connection failed: ${err.message}`,
        });
      });
      req.end();
    });

    this.cache.set(cacheKey, result, 60);
    return result;
  }

  private async aiHealth(surface: AiSurface, deep: boolean): Promise<AiHealth> {
    const model = this.ai.getModel(surface);
    if (deep) {
      const probed = await this.ai.probe(surface);
      return { ...probed, checkedBy: 'probe', verified: true, checkedAt: new Date().toISOString() };
    }
    // A real call is better evidence than a probe, so it wins when both exist.
    const last = this.ai.lastCallOutcome(surface);
    if (last && last.model === model) {
      return { ok: last.ok, model, error: last.error, checkedBy: 'recent-traffic', verified: true, checkedAt: last.at };
    }
    // Same key AiService.probe() writes; reading it costs nothing.
    const cached = this.cache.get<{ ok: boolean; model: string; error: string | null }>(`ai-probe:${model}`);
    if (cached) {
      return { ...cached, checkedBy: 'cached-probe', verified: true, checkedAt: null };
    }
    const available = await this.ai.isAvailable();
    return {
      ok: available,
      model,
      error: available
        ? null
        : process.env.ANTHROPIC_API_KEY
          ? 'The Anthropic SDK could not be loaded on the server.'
          : 'No Anthropic API key is configured on the server.',
      checkedBy: 'config',
      verified: false,
      checkedAt: null,
    };
  }

  /** Supabase Auth: the service every sign-up and sign-in goes through. */
  private async checkAuth(): Promise<ComponentCheck> {
    const cached = this.cache.get<ComponentCheck>('ops:auth');
    if (cached) return cached;

    const base = process.env.SUPABASE_URL?.replace(/\/+$/, '');
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    let result: ComponentCheck;
    if (!base || !key) {
      result = {
        ok: false,
        configured: false,
        latencyMs: null,
        detail: 'SUPABASE_URL or SUPABASE_ANON_KEY is not set on the API server.',
      };
    } else {
      const res = await httpGet(`${base}/auth/v1/health`, { apikey: key, 'User-Agent': 'AYO-ops-check' });
      const ok = res.status === 200;
      result = {
        ok,
        configured: true,
        latencyMs: res.status ? res.latencyMs : null,
        detail: ok
          ? `Responded in ${res.latencyMs}ms.`
          : res.status
            ? `the Supabase Auth health check returned HTTP ${res.status}.`
            : `the Supabase Auth service could not be reached (${res.error}).`,
      };
    }
    this.cache.set('ops:auth', result, 60);
    return result;
  }

  /** R2: documents, CMS images and persisted reports. HeadBucket is free. */
  private async checkStorage(): Promise<ComponentCheck & { bucket: string | null }> {
    const cached = this.cache.get<ComponentCheck & { bucket: string | null }>('ops:storage');
    if (cached) return cached;

    const started = Date.now();
    const health = await this.r2.health();
    const latencyMs = Date.now() - started;
    const result = {
      ok: health.configured && health.reachable,
      configured: health.configured,
      latencyMs: health.reachable ? latencyMs : null,
      bucket: health.bucket,
      detail: !health.configured
        ? `R2 is not configured on the API server (missing ${health.missingVars?.join(', ') || 'env vars'}).`
        : health.reachable
          ? `Bucket answered in ${latencyMs}ms.`
          : 'the R2 bucket did not answer a test request.',
    };
    if (!result.ok && health.reason) this.logger.warn(`R2 check failed: ${health.reason}`);
    this.cache.set('ops:storage', result, 60);
    return result;
  }

  /**
   * Resend: listing domains is a free read that proves the key works and shows
   * whether the sending domain is verified. A send-only ("restricted") key
   * cannot list domains; its 401 still proves the key is genuine.
   */
  private async checkEmail(): Promise<ComponentCheck & { domainVerified: boolean | null }> {
    const cached = this.cache.get<ComponentCheck & { domainVerified: boolean | null }>('ops:email');
    if (cached) return cached;

    const apiKey = process.env.RESEND_API_KEY;
    let result: ComponentCheck & { domainVerified: boolean | null };
    if (!apiKey || !this.mail.isConfigured) {
      result = {
        ok: false,
        configured: false,
        latencyMs: null,
        domainVerified: null,
        detail: 'RESEND_API_KEY is not set on the API server.',
      };
    } else {
      const res = await httpGet('https://api.resend.com/domains', {
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'AYO-ops-check',
      });
      let parsed: any = null;
      try {
        parsed = JSON.parse(res.body);
      } catch {
        /* non-JSON body */
      }
      const fromDomain = (process.env.FROM_EMAIL || 'noreply@pacsda.org')
        .match(/@([^>\s]+)/)?.[1]
        ?.toLowerCase();
      if (res.status === 200) {
        const domains: any[] = Array.isArray(parsed?.data) ? parsed.data : [];
        const match = domains.find((d) => String(d?.name).toLowerCase() === fromDomain);
        const verified = match ? match.status === 'verified' : false;
        result = {
          ok: verified,
          configured: true,
          latencyMs: res.latencyMs,
          domainVerified: verified,
          detail: verified
            ? `Key accepted and ${fromDomain} is verified (${res.latencyMs}ms).`
            : match
              ? `the sending domain ${fromDomain} is "${match.status}" in Resend, not verified.`
              : `the sending domain ${fromDomain} is not set up in this Resend account.`,
        };
      } else if (res.status === 401 && /restricted/i.test(res.body)) {
        result = {
          ok: true,
          configured: true,
          latencyMs: res.latencyMs,
          domainVerified: null,
          detail: 'Send-only key accepted (domain status cannot be read with this key).',
        };
      } else {
        result = {
          ok: false,
          configured: true,
          latencyMs: res.status ? res.latencyMs : null,
          domainVerified: null,
          detail:
            res.status === 401 || res.status === 403
              ? 'Resend rejected the API key.'
              : res.status
                ? `Resend returned HTTP ${res.status}.`
                : `Resend could not be reached (${res.error}).`,
        };
      }
    }
    this.cache.set('ops:email', result, 300);
    return result;
  }

  private async checkDataFreshness() {
    const [latest, lastSource] = await Promise.all([
      this.prisma.indicatorValue.aggregate({
        where: { ageGroup: DEFAULT_AGE_GROUP },
        _max: { year: true },
      }),
      this.prisma.dataSource.findFirst({
        where: { lastSync: { not: null } },
        orderBy: { lastSync: 'desc' },
        select: { lastSync: true, name: true },
      }),
    ]);

    const lastSync = lastSource?.lastSync ?? null;
    // 90 days with no ingestion is the point where "the numbers are current"
    // stops being true for a platform that tracks annual indicators.
    const stale = lastSync
      ? Date.now() - lastSync.getTime() > 90 * 24 * 60 * 60 * 1000
      : false;

    return {
      latestDataYear: latest._max.year ?? null,
      lastIngestedAt: lastSync ? lastSync.toISOString() : null,
      lastIngestedSource: lastSource?.name ?? null,
      stale,
    };
  }

  // ── Users: "how many signed up" ──────────────────────────────

  async getUsers() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, byRole, newThisWeek, newThisMonth, activeThisMonth, subscribers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
        this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
        this.prisma.user.count({ where: { lastLogin: { gte: monthAgo } } }),
        this.prisma.newsletterSubscription.count({ where: { status: 'SUBSCRIBED' } }),
      ]);

    const roleMap: Record<string, number> = {};
    for (const entry of byRole) roleMap[entry.role] = entry._count.id;

    // `activeThisMonth` counts users with a lastLogin stamp inside 30 days.
    // Nothing wrote lastLogin before the JwtStrategy change that ships with
    // this module, so it undercounts until existing users next sign in — a 0
    // here means "no sign-ins recorded yet", not "nobody is using the site".
    // Said plainly rather than dropped, because a spoken "zero active users"
    // would otherwise sound like an outage.
    const activeIsReliable = activeThisMonth > 0;
    const activeSentence = activeIsReliable
      ? `${activeThisMonth} signed in within the last 30 days.`
      : 'No sign-ins recorded in the last 30 days — login tracking only starts once each user next signs in, so treat this as unknown rather than zero.';

    return {
      totalUsers: total,
      newThisWeek,
      newThisMonth,
      activeThisMonth,
      activeTrackingReliable: activeIsReliable,
      byRole: roleMap,
      newsletterSubscribers: subscribers,
      summary:
        `${total} registered ${total === 1 ? 'user' : 'users'}, ` +
        `${newThisWeek} new this week and ${newThisMonth} in the last 30 days. ` +
        `${activeSentence} ` +
        `${subscribers} newsletter subscribers.`,
      asOf: new Date().toISOString(),
    };
  }

  // ── Numbers: "just get me the numbers" ───────────────────────

  async getNumbers() {
    const cacheKey = 'ops:numbers';
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const ageGroupFilter = { ageGroup: DEFAULT_AGE_GROUP };

    const [
      countries,
      indicators,
      themes,
      dataPoints,
      yearRange,
      indexedCountries,
      experts,
      policies,
      documents,
      users,
      subscribers,
    ] = await Promise.all([
      this.prisma.country.count(),
      this.prisma.indicator.count(),
      this.prisma.theme.count(),
      this.prisma.indicatorValue.count({ where: ageGroupFilter }),
      this.prisma.indicatorValue.aggregate({
        where: ageGroupFilter,
        _min: { year: true },
        _max: { year: true },
      }),
      this.prisma.youthIndexScore.groupBy({ by: ['countryId'] }),
      this.prisma.expert.count(),
      this.prisma.countryPolicy.count(),
      this.prisma.document.count(),
      this.prisma.user.count(),
      this.prisma.newsletterSubscription.count({ where: { status: 'SUBSCRIBED' } }),
    ]);

    const result = {
      countries,
      indicators,
      themes,
      dataPoints,
      dataYearRange: { earliest: yearRange._min.year, latest: yearRange._max.year },
      countriesWithIndexScore: indexedCountries.length,
      experts,
      policies,
      documents,
      users,
      newsletterSubscribers: subscribers,
      summary:
        `${dataPoints.toLocaleString('en-US')} youth data points across ${countries} countries, ` +
        `${indicators} indicators and ${themes} themes, covering ` +
        `${yearRange._min.year}–${yearRange._max.year}. ` +
        `${indexedCountries.length} countries have a Youth Index score.`,
      asOf: new Date().toISOString(),
    };

    this.cache.set(cacheKey, result, 300);
    return result;
  }
}
