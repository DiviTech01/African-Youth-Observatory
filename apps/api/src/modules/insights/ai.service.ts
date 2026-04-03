import { Injectable, Logger } from '@nestjs/common';

/**
 * Reusable wrapper for the Anthropic Claude API.
 * Gracefully falls back to null when no API key is configured — callers
 * must check the return value and use rule-based logic when null.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: unknown | null = null;
  private initialized = false;

  private async ensureClient(): Promise<unknown | null> {
    if (this.initialized) return this.client;
    this.initialized = true;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not set — AI features will use rule-based fallback');
      return null;
    }

    try {
      // Dynamic import so the app doesn't crash if @anthropic-ai/sdk is not installed
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      this.client = new Anthropic({ apiKey });
      this.logger.log('Anthropic SDK initialized successfully');
    } catch (err) {
      this.logger.warn(
        'Failed to load @anthropic-ai/sdk — AI features will use rule-based fallback. ' +
        'Install with: pnpm add @anthropic-ai/sdk',
      );
      this.client = null;
    }
    return this.client;
  }

  async generate(
    systemPrompt: string,
    userPrompt: string,
    maxTokens?: number,
  ): Promise<string | null> {
    const client = await this.ensureClient();
    if (!client) return null;

    try {
      const anthropic = client as {
        messages: {
          create: (params: Record<string, unknown>) => Promise<{
            content: { type: string; text?: string }[];
          }>;
        };
      };

      const response = await anthropic.messages.create({
        model: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const first = response.content[0];
      return first?.type === 'text' ? first.text ?? null : null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`AI generation failed: ${msg}`);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    const client = await this.ensureClient();
    return client !== null;
  }

  getModel(): string {
    return process.env.AI_MODEL || 'claude-sonnet-4-20250514';
  }
}
