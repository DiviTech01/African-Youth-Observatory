import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { NlqService } from '../nlq/nlq.service';

interface AiChatResponse {
  answer: string;
  visualization?: object;
  followUpQuestions?: string[];
  source: 'ai' | 'rule-based';
}

const SYSTEM_PROMPT = `You are the African Youth Observatory AI assistant. You help users explore data about African youth across education, employment, health, entrepreneurship, and demographics. You have access to data from 54 African countries across 5 sub-regions: Northern, Western, Central, Eastern, and Southern Africa.

When asked for a report, document, or structured analysis: use markdown formatting with ## for main sections, ### for sub-sections, bullet points for lists, and include a summary section. Write complete, professional documents.

When relevant, include a data visualization by appending a JSON block in this exact format:
\`\`\`json
{"type":"bar","title":"Chart Title","data":[{"name":"Country/Category","value":42.5}]}
\`\`\`
Supported types: bar, line, pie, area, table. For tables use: {"type":"table","columns":["Col1","Col2"],"rows":[["val1","val2"]]}

Be concise, data-driven, and helpful. Use specific numbers and statistics where possible.`;

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

  async chat(
    message: string,
    context?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<AiChatResponse> {
    if (this.anthropic) {
      try {
        return await this.callClaude(message, context, history);
      } catch (error) {
        this.logger.error(`Claude API call failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return this.fallbackToNlq(message);
  }

  private async callClaude(
    message: string,
    context?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<AiChatResponse> {
    const userContent = context
      ? `Context from uploaded document:\n${context}\n\nUser question: ${message}`
      : message;

    const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...(history || []),
      { role: 'user', content: userContent },
    ];

    if (!this.anthropic) throw new Error('Anthropic client not initialized');
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: conversationMessages,
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
