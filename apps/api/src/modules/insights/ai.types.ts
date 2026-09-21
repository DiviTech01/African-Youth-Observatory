/** Which product surface a call is for — decides which model it routes to. */
export type AiSurface = 'chat' | 'report';

/**
 * Every surface runs on Sonnet 5 ($2/$10 per MTok). Haiku 4.5 ($1/$5) is the only
 * cheaper option worth considering.
 *
 * Reports used to route to a frontier-tier model on the reasoning that they are
 * the low-volume, high-stakes surface. Measured, six test reports cost ~1.83M
 * tokens — about 305k each, because the tool loop resends its whole growing
 * history every iteration — roughly $10 for six documents. On a public, uncapped
 * endpoint that is a liability rather than a feature.
 *
 * The quality risk in a report is a fabricated number, and that is controlled by
 * the tool loop fetching real figures and the validator rejecting malformed
 * output — not by model size. Premium-tier models are not used anywhere on this
 * platform; if that ever changes, put a per-report cost ceiling in front of it
 * first.
 */
export const DEFAULT_MODELS: Record<AiSurface, string> = {
  chat: 'claude-sonnet-5',
  report: 'claude-sonnet-5',
};
