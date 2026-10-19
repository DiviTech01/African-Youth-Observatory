import { Injectable, Logger } from '@nestjs/common';
import type { AiSpendDay } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AiSurface } from './ai.types';

/**
 * Thrown when a call would cross a daily ceiling. Callers must treat this the
 * same way they treat "no API key": fall back to the rule-based engine and say
 * so, never surface a 500.
 */
export class AiBudgetExceededError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = 'AiBudgetExceededError';
  }
}

/** USD per million tokens, input/output. Keep in step with DEFAULT_MODELS. */
const PRICES: Record<string, { in: number; out: number }> = {
  'claude-sonnet-5': { in: 2, out: 10 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5 },
};

/**
 * Used when a model id is not in the table above — deliberately pessimistic, so
 * an unrecognised model is over-counted and trips the ceiling early rather than
 * spending silently. Under-estimating an unknown model is the failure that costs
 * money; over-estimating one only causes an early, visible refusal.
 */
const FALLBACK_PRICE = { in: 5, out: 25 };

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw?.trim()) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * A hard ceiling on what the Anthropic key can be made to spend in a day.
 *
 * Per-IP throttles do not bound this: `/nlq/query` and `/insight-reports/generate`
 * are public, and a report is a multi-call tool-use loop, so an actor rotating
 * IPs can spend without limit. This meters every call at the SDK
 * chokepoint and refuses once the day's ceiling is reached, which degrades the
 * product to rule-based answers instead of running up a bill.
 *
 * The ledger is the `AiSpendDay` table (one row per UTC day), written only with
 * atomic increments, so a restart does not reset it and every Render instance
 * draws on the same allowance. The check-then-call is not a transaction: calls
 * that pass the check concurrently can overshoot the ceiling by those few calls.
 * That is bounded and acceptable; serialising every AI call through a row lock
 * is not.
 *
 * If the ledger cannot be read, spending FAILS CLOSED: the call is refused and
 * the product degrades to rule-based answers. An unmetered key is exactly the
 * failure this class exists to prevent.
 */
@Injectable()
export class AiBudgetService {
  private readonly logger = new Logger(AiBudgetService.name);

  constructor(private readonly prisma: PrismaService) {}

  private static today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get limits() {
    return {
      // Deliberately low defaults. A ceiling only protects you if it is lower
      // than the amount that would hurt: $10 of unexpected spend was already
      // enough to be a problem here, so the default refuses at $5/day and the
      // owner raises it consciously rather than discovering it after the fact.
      usdPerDay: envNumber('AI_DAILY_BUDGET_USD', 5),
      reportsPerDay: envNumber('AI_DAILY_MAX_REPORTS', 25),
      chatCallsPerDay: envNumber('AI_DAILY_MAX_CHAT_CALLS', 500),
    };
  }

  /** Atomic increment of today's row, creating it on first use (native upsert). */
  private bump(day: string, data: {
    usd?: number;
    chatCalls?: number;
    reportCalls?: number;
    inputTokens?: number;
    outputTokens?: number;
    rejected?: number;
  }) {
    const increments = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, { increment: v }]),
    );
    return this.prisma.aiSpendDay.upsert({
      where: { day },
      create: { day, ...data },
      update: increments,
    });
  }

  private refuse(day: string, reason: string): never {
    // Counting the refusal is best-effort; the refusal itself is not.
    this.bump(day, { rejected: 1 }).catch(() => undefined);
    throw new AiBudgetExceededError(reason);
  }

  /** Throws AiBudgetExceededError if this call must not be made. */
  async assertWithinBudget(surface: AiSurface): Promise<void> {
    const dayKey = AiBudgetService.today();
    const limits = this.limits;

    let day: { usd: number; chatCalls: number; reportCalls: number } | null;
    try {
      day = await this.prisma.aiSpendDay.findUnique({
        where: { day: dayKey },
        select: { usd: true, chatCalls: true, reportCalls: true },
      });
    } catch (err: unknown) {
      this.logger.error(
        `AI spend ledger unreachable, refusing AI call: ${err instanceof Error ? err.message : err}`,
      );
      throw new AiBudgetExceededError(
        'The AI spend ledger could not be read, so AI calls are paused until the database answers again.',
      );
    }

    const usd = day?.usd ?? 0;
    if (usd >= limits.usdPerDay) {
      this.refuse(dayKey, `Daily AI budget of $${limits.usdPerDay} reached (spent ~$${usd.toFixed(2)}).`);
    }

    const cap = surface === 'report' ? limits.reportsPerDay : limits.chatCallsPerDay;
    const used = surface === 'report' ? day?.reportCalls ?? 0 : day?.chatCalls ?? 0;
    if (used >= cap) {
      this.refuse(dayKey, `Daily ${surface} call limit of ${cap} reached.`);
    }
  }

  /**
   * Records what a completed call actually cost.
   *
   * Reports cache the tools+system prefix, so cache tokens are the bulk of their
   * input and are priced differently from fresh input: a 5-minute cache write is
   * 1.25x the input rate and a cache read 0.1x. Charging both at the plain input
   * rate would overstate a cached report by roughly an order of magnitude and
   * trip the ceiling early.
   *
   * Never throws: the money is already spent, and failing the caller's request
   * now would not get it back. A failed write is logged loudly instead.
   */
  async record(
    surface: AiSurface,
    model: string,
    usage:
      | {
          input_tokens?: number;
          output_tokens?: number;
          cache_creation_input_tokens?: number;
          cache_read_input_tokens?: number;
        }
      | undefined,
  ): Promise<void> {
    const dayKey = AiBudgetService.today();
    const price = PRICES[model] ?? FALLBACK_PRICE;
    const inTok = usage?.input_tokens ?? 0;
    const outTok = usage?.output_tokens ?? 0;
    const cacheWrite = usage?.cache_creation_input_tokens ?? 0;
    const cacheRead = usage?.cache_read_input_tokens ?? 0;
    const usd =
      (inTok / 1_000_000) * price.in +
      (cacheWrite / 1_000_000) * price.in * 1.25 +
      (cacheRead / 1_000_000) * price.in * 0.1 +
      (outTok / 1_000_000) * price.out;

    try {
      const row = await this.bump(dayKey, {
        usd,
        ...(surface === 'report' ? { reportCalls: 1 } : { chatCalls: 1 }),
        inputTokens: inTok + cacheWrite + cacheRead,
        outputTokens: outTok,
      });
      const limits = this.limits;
      if (row.usd >= limits.usdPerDay * 0.8) {
        this.logger.warn(`AI spend at ~$${row.usd.toFixed(2)} of $${limits.usdPerDay} for ${dayKey}`);
      }
    } catch (err: unknown) {
      this.logger.error(
        `Could not record ~$${usd.toFixed(4)} of ${surface} AI spend for ${dayKey}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /** For /ops/status and the admin surface. */
  async snapshot() {
    const dayKey = AiBudgetService.today();
    const limits = this.limits;
    let row: AiSpendDay | null = null;
    let ledgerReachable = true;
    try {
      row = await this.prisma.aiSpendDay.findUnique({ where: { day: dayKey } });
    } catch {
      ledgerReachable = false;
    }
    const usd = row?.usd ?? 0;
    return {
      day: dayKey,
      estimatedUsd: Number(usd.toFixed(4)),
      budgetUsd: limits.usdPerDay,
      // An unreadable ledger means every call is being refused (fail closed),
      // which to an operator looks exactly like an exhausted budget.
      exhausted: !ledgerReachable || usd >= limits.usdPerDay,
      calls: { chat: row?.chatCalls ?? 0, report: row?.reportCalls ?? 0 },
      inputTokens: row?.inputTokens ?? 0,
      outputTokens: row?.outputTokens ?? 0,
      rejectedCalls: row?.rejected ?? 0,
      limits,
      shared: true,
      ledgerReachable,
    };
  }
}
