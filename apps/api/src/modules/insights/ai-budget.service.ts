import { Injectable, Logger } from '@nestjs/common';
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

interface DayLedger {
  day: string;
  usd: number;
  calls: Record<AiSurface, number>;
  inputTokens: number;
  outputTokens: number;
  rejected: number;
}

function emptyLedger(day: string): DayLedger {
  return { day, usd: 0, calls: { chat: 0, report: 0 }, inputTokens: 0, outputTokens: 0, rejected: 0 };
}

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
 * The counters are in-process: a restart resets them, and two Render instances
 * would each get their own allowance. That is a deliberate first cut — it bounds
 * the realistic abuse case (sustained traffic against one instance). A shared
 * counter needs a table; see AYO_WORK_STATE.md.
 */
@Injectable()
export class AiBudgetService {
  private readonly logger = new Logger(AiBudgetService.name);
  private ledger: DayLedger = emptyLedger(AiBudgetService.today());

  private static today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private current(): DayLedger {
    const day = AiBudgetService.today();
    if (this.ledger.day !== day) this.ledger = emptyLedger(day);
    return this.ledger;
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

  /** Throws AiBudgetExceededError if this call must not be made. */
  assertWithinBudget(surface: AiSurface): void {
    const day = this.current();
    const limits = this.limits;

    if (day.usd >= limits.usdPerDay) {
      day.rejected++;
      throw new AiBudgetExceededError(
        `Daily AI budget of $${limits.usdPerDay} reached (spent ~$${day.usd.toFixed(2)}).`,
      );
    }

    const cap = surface === 'report' ? limits.reportsPerDay : limits.chatCallsPerDay;
    if (day.calls[surface] >= cap) {
      day.rejected++;
      throw new AiBudgetExceededError(
        `Daily ${surface} call limit of ${cap} reached.`,
      );
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
   */
  record(
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
  ): void {
    const day = this.current();
    const price = PRICES[model] ?? FALLBACK_PRICE;
    const inTok = usage?.input_tokens ?? 0;
    const outTok = usage?.output_tokens ?? 0;
    const cacheWrite = usage?.cache_creation_input_tokens ?? 0;
    const cacheRead = usage?.cache_read_input_tokens ?? 0;

    day.calls[surface]++;
    day.inputTokens += inTok + cacheWrite + cacheRead;
    day.outputTokens += outTok;
    day.usd +=
      (inTok / 1_000_000) * price.in +
      (cacheWrite / 1_000_000) * price.in * 1.25 +
      (cacheRead / 1_000_000) * price.in * 0.1 +
      (outTok / 1_000_000) * price.out;

    const limits = this.limits;
    if (day.usd >= limits.usdPerDay * 0.8) {
      this.logger.warn(
        `AI spend at ~$${day.usd.toFixed(2)} of $${limits.usdPerDay} for ${day.day}`,
      );
    }
  }

  /** For /ops/status and the admin surface. */
  snapshot() {
    const day = this.current();
    const limits = this.limits;
    return {
      day: day.day,
      estimatedUsd: Number(day.usd.toFixed(4)),
      budgetUsd: limits.usdPerDay,
      exhausted: day.usd >= limits.usdPerDay,
      calls: { ...day.calls },
      inputTokens: day.inputTokens,
      outputTokens: day.outputTokens,
      rejectedCalls: day.rejected,
      limits,
      shared: false,
    };
  }
}
