/** Which product surface a call is for — decides which model it routes to. */
export type AiSurface = 'chat' | 'report';

/**
 * Current-generation defaults. Sonnet 5 is $2/$10 per MTok, Opus 5 is $5/$25 —
 * the split keeps high-volume chat cheap while reports get the better model.
 */
export const DEFAULT_MODELS: Record<AiSurface, string> = {
  chat: 'claude-sonnet-5',
  report: 'claude-opus-5',
};
