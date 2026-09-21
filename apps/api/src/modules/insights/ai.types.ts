/** Which product surface a call is for — decides which model it routes to. */
export type AiSurface = 'chat' | 'report';

/**
 * Current-generation defaults. Per MTok input/output: Haiku 4.5 $1/$5,
 * Sonnet 5 $2/$10, Opus 5 $5/$25.
 *
 * Reports ran on Opus 5 until 2026-09-21. Six test reports cost ~1.83M tokens —
 * about 305k per report, because the tool loop resends its whole growing history
 * on every iteration — which came to roughly $10 for six documents. At that rate
 * a public, uncapped report endpoint is not a feature, it is a liability.
 *
 * Sonnet 5 is 2.5x cheaper on both sides and is a capable long-form writer; the
 * quality risk in a report is fabricated numbers, and that is controlled by the
 * tool loop and the validator, not by model size. Together with the request-shape
 * changes in insight-reports.service.ts this cuts the per-report cost by roughly
 * an order of magnitude. Do not put reports back on Opus without a per-report
 * cost ceiling in front of it.
 */
export const DEFAULT_MODELS: Record<AiSurface, string> = {
  chat: 'claude-sonnet-5',
  report: 'claude-sonnet-5',
};
