import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { NlqService } from '../nlq/nlq.service';

interface AiChatResponse {
  answer: string;
  visualization?: object;
  followUpQuestions?: string[];
  source: 'ai' | 'rule-based';
}

const SYSTEM_PROMPT = `You are the African Youth Observatory AI assistant. You help users explore data about African youth across education, employment, health, entrepreneurship, and demographics. You have access to data from 54 African countries. When relevant, suggest data visualizations by including a JSON block with chart data. Be concise, data-driven, and helpful.`;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private anthropic: Anthropic | null = null;

  constructor(private readonly nlqService: NlqService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      this.logger.log('Anthropic API client initialized');
    } else {
      this.logger.warn(
        'ANTHROPIC_API_KEY not configured — AI chat will fall back to NLQ rule-based service',
      );
    }
  }

  async chat(message: string, context?: string): Promise<AiChatResponse> {
    // Try Claude API first
    if (this.anthropic) {
      try {
        return await this.callClaude(message, context);
      } catch (error) {
        this.logger.error(`Claude API call failed: ${error.message}`);
      }
    }

    // Fall back to rule-based NLQ service
    return this.fallbackToNlq(message);
  }

  private async callClaude(
    message: string,
    context?: string,
  ): Promise<AiChatResponse> {
    const userContent = context
      ? `Context: ${context}\n\nUser question: ${message}`
      : message;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Extract visualization JSON if present
    const visualization = this.extractVisualization(rawText);
    const answer = visualization
      ? rawText.replace(/```json\s*\{[\s\S]*?\}\s*```/, '').trim()
      : rawText;

    return {
      answer,
      visualization: visualization || undefined,
      followUpQuestions: this.generateFollowUps(message),
      source: 'ai',
    };
  }

  private async fallbackToNlq(message: string): Promise<AiChatResponse> {
    this.logger.log('Falling back to NLQ rule-based service');

    const nlqResult = await this.nlqService.processQuery(message);

    return {
      answer: nlqResult.answer,
      visualization: nlqResult.visualization || undefined,
      followUpQuestions: nlqResult.followUpQuestions,
      source: 'rule-based',
    };
  }

  private extractVisualization(text: string): object | null {
    const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) return null;

    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      return null;
    }
  }

  private generateFollowUps(message: string): string[] {
    const q = message.toLowerCase();

    const followUps: string[] = [];

    if (/unemployment|employment|jobs/.test(q)) {
      followUps.push('Which African countries have the lowest youth unemployment?');
      followUps.push('How has youth employment changed over the last decade?');
      followUps.push('What is the relationship between education and youth employment in Africa?');
    } else if (/education|school|literacy/.test(q)) {
      followUps.push('Which countries have the highest youth literacy rates?');
      followUps.push('How does education spending correlate with enrollment rates?');
      followUps.push('What are the gender gaps in education across Africa?');
    } else if (/health|mortality|fertility/.test(q)) {
      followUps.push('Which regions have the best youth health outcomes?');
      followUps.push('How has adolescent fertility changed over time?');
      followUps.push('What is the HIV prevalence rate among African youth?');
    } else {
      followUps.push('What are the top challenges facing African youth today?');
      followUps.push('Which countries rank highest on the Youth Development Index?');
      followUps.push('How does internet access vary across African regions?');
    }

    return followUps.slice(0, 3);
  }
}
