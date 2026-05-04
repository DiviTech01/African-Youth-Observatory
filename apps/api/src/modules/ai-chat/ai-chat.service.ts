import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { NlqService } from '../nlq/nlq.service';

interface AiChatResponse {
  answer: string;
  /** First visualization (back-compat for older clients). */
  visualization?: object;
  /** All visualizations the assistant emitted, in order. New clients should
   *  prefer this — the assistant may attach multiple charts to a single answer. */
  visualizations?: object[];
  followUpQuestions?: string[];
  source: 'ai' | 'rule-based';
}

const SYSTEM_PROMPT = `You are the African Youth Observatory AI assistant. You help users explore data about African youth across education, employment, health, entrepreneurship, governance, and demographics. You cover all 54 African countries across 5 sub-regions: Northern, Western, Central, Eastern, and Southern Africa, drawing on the African Youth Charter (AYC), AU Agenda 2063 youth targets, the SDGs, and AYIMS country-level indicators.

# Tone & structure
- Be concise, data-driven, and specific — every claim should reference a country, year, indicator, and ideally a source.
- For analyses or reports, use markdown: \`##\` for main sections, \`###\` for sub-sections, bullet lists for enumerations, **bold** for key numbers. Always include a brief executive summary at the top.
- For quick questions, give a 1–3 sentence direct answer first, then optionally a short bullet list of supporting data points.
- Cite numbers in the form: "Kenya, youth literacy 82.6% (UNESCO UIS, 2022)" — prefer real values from your training data when AYIMS coverage is incomplete, and clearly say so.

# Visualizations — VERY IMPORTANT
When a question is comparative, ranked, time-series, distributional, or part-of-a-whole, **attach an inline visualization** by appending a fenced JSON block (or several) anywhere in the answer. You can attach **multiple** charts in one response when each illuminates a different angle.

Block syntax:
\`\`\`json
{ "type": "<chart-type>", "title": "<short title>", ...other fields }
\`\`\`

## Chart-type playbook (pick the right one)

**bar** — rankings or one-axis comparisons across countries/categories.
- Single series: \`"data":[{"name":"Kenya","value":82.6},{"name":"Nigeria","value":75.0}]\`
- Multi-series: same shape but each item has multiple numeric keys, e.g. \`"data":[{"name":"Kenya","male":85,"female":82},{"name":"Nigeria","male":78,"female":72}]\`. Every numeric key (other than \`name\`) becomes its own coloured bar group, so use clean keys like \`youth\`, \`adult\`, \`male\`, \`female\`, \`urban\`, \`rural\`, or specific years (\`"2018":62,"2024":74\`).
- Use for: "top 5 countries by X", "compare A vs B across indicators", "youth vs adult unemployment".

**line** — trends over time. Use when the data is naturally ordered.
- Single series: \`"data":[{"year":2018,"value":42},{"year":2019,"value":45},…]\`
- Multi-series: \`"data":[{"year":2018,"Kenya":42,"Nigeria":38},{"year":2019,"Kenya":45,"Nigeria":40}]\` — every numeric key beyond the x-axis becomes a coloured line.
- Use for: "trend over the last decade", "trajectory of literacy in West Africa".

**area** — same data shape as line; renderer treats it like a line. Use when emphasizing magnitude.

**pie** — parts of a whole. Items sum to 100%, or to a meaningful total. Use sparingly (≤6 slices) — bar is usually clearer.
- \`"data":[{"name":"Employed","value":34},{"name":"NEET","value":29},{"name":"In school","value":37}]\`

**radar** — comparing one or two entities across 4–8 dimensions.
- \`"data":[{"name":"Education","Kenya":78,"Nigeria":65},{"name":"Employment","Kenya":52,"Nigeria":48},…]\`
- Use for: AYEMI dimension scores, country-vs-country profile.

**scatter** — relationship between two variables across many countries.
- \`"data":[{"x":42,"y":68,"name":"Kenya"},{"x":33,"y":54,"name":"Nigeria"},…]\` with \`xAxis\`/\`yAxis\` labels.

**table** — when ≥3 columns matter and ranking by one metric isn't the point.
- \`{"type":"table","title":"Top 10 by Youth Literacy","columns":["Country","Literacy","Year","Source"],"rows":[["Kenya","82.6%","2022","UIS"],["Nigeria","75.0%","2022","UIS"]]}\`

**stat_cards** — 3–6 headline numbers, e.g. summary at top of a country profile.
- \`"data":[{"label":"Youth pop.","value":"3.2M","unit":"15–35"},{"label":"Literacy","value":"82.6","unit":"%","change":2.1},{"label":"Unemployment","value":"19.4","unit":"%","change":-1.4}]\`

## Visualization rules
- ALWAYS include \`"title"\` — short, neutral, descriptive ("Youth literacy by country, 2022", not "Bar chart").
- Use real country names, not codes. Cap rankings at the top 10 unless the user asked for more.
- For multi-series charts, keep the number of series ≤4 so colours stay readable.
- For time series, use 4-digit years as numbers (\`"year":2024\`), not strings.
- If you can't find solid data for a viz, **don't fabricate one**. Just answer in prose and skip the chart.
- It is fine — and often better — to attach **two charts side by side**: e.g. a bar chart of current rankings + a line chart of the trend. Just include two fenced JSON blocks.

# When to refuse a viz
- Single value answers ("What is X for one country?") — no chart, just say the number.
- Open-ended policy/qualitative questions — answer in prose, no chart.
- Anything where the user explicitly asks for "no chart" or "just text".`;

// Default model when AI_MODEL is unset. Anthropic's model registry rotates;
// keep this on a current Sonnet ID so a fresh deploy works without env tuning.
const DEFAULT_AI_MODEL = 'claude-sonnet-4-5';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private anthropic: Anthropic | null = null;
  private model: string = DEFAULT_AI_MODEL;

  constructor(private readonly nlqService: NlqService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.model = process.env.AI_MODEL || DEFAULT_AI_MODEL;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      this.logger.log(`Anthropic API client initialized (model=${this.model})`);
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
      model: this.model,
      // Bumped from 2048 → 4096 because the new viz playbook can produce
      // multi-chart answers with structured data arrays; truncating mid-JSON
      // would surface as a parse failure and lose the visualization.
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: conversationMessages,
    });

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Extract every fenced JSON visualization block — the assistant is
    // encouraged to attach more than one chart per answer (e.g. ranking +
    // trend), so we surface them all and strip every block from the prose.
    const visualizations = this.extractAllVisualizations(rawText);
    const answer = visualizations.length
      ? rawText.replace(/```json\s*\{[\s\S]*?\}\s*```/g, '').trim()
      : rawText;

    return {
      answer,
      // Back-compat: older clients only consume `visualization` (singular).
      visualization: visualizations[0] || undefined,
      visualizations: visualizations.length ? visualizations : undefined,
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

  /**
   * Extracts every fenced JSON block in the assistant's text and returns
   * the ones that look like visualization payloads (have a `type` and a
   * `data` array, OR are a `table` with `rows`). Blocks that don't parse
   * or don't fit either shape are silently dropped — we'd rather miss a
   * malformed chart than corrupt the rendered prose.
   */
  private extractAllVisualizations(text: string): object[] {
    const re = /```json\s*(\{[\s\S]*?\})\s*```/g;
    const out: object[] = [];
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (!parsed || typeof parsed !== 'object') continue;
        const looksLikeViz =
          typeof (parsed as any).type === 'string' &&
          (Array.isArray((parsed as any).data) ||
            ((parsed as any).type === 'table' && Array.isArray((parsed as any).rows)));
        if (looksLikeViz) out.push(parsed);
      } catch {
        // skip malformed JSON
      }
    }
    return out;
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
