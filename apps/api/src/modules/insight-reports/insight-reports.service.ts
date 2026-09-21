import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NewsletterAudience } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../insights/ai.service';
import { AiContextService } from '../insights/ai-context.service';
import { formatDimensionLabel, formatTierLabel, stripNonWinAnsi } from '../../common/utils/labels';
import { NewsletterService } from '../newsletter/newsletter.service';
import { ReportStoreService } from './report-store.service';
import {
  ReportBlock,
  ReportCitation,
  ReportDocument,
  ReportFormat,
  ReportSection,
  StoredReport,
  REPORT_MIME,
} from './report-document.model';
import { renderReportHtml, renderStandaloneHtml } from './renderers/html.renderer';
import { renderReportPdf } from './renderers/pdf.renderer';
import { renderReportPptx } from './renderers/pptx.renderer';
import { renderReportXlsx } from './renderers/xlsx.renderer';

export type ReportScope = 'continental' | 'country' | 'theme';

/**
 * Reports are the one surface where a wrong number is worse than no report, so
 * the model is not asked to recall figures from a context blob — it is given
 * the same read-only query tools the chat analyst uses and has to fetch what it
 * cites.
 *
 * Four round trips, down from six. Every iteration resends the entire
 * conversation so far, so the input cost of a loop grows quadratically, not
 * linearly — the last two iterations were the most expensive and the least
 * used. Measured reports emitted on iteration 4 or 5 of 6; four is enough for
 * index, trend, regional average and peer comparison, and the final-round
 * instruction below tells the model to spend its last turn writing.
 */
const MAX_TOOL_ITERATIONS = 4;

/**
 * Ceiling on a single tool result, in characters (~4 chars per token, so ~3k
 * tokens). Resent on every subsequent iteration, so this is charged repeatedly.
 */
const MAX_TOOL_RESULT_CHARS = 12000;

/**
 * How long a generated report answers the same request before it is regenerated.
 * Twelve hours: the underlying data moves on uploads, not on page views, and the
 * alternative is paying for a new document every time someone reloads.
 */
const REPORT_REUSE_MS = 12 * 60 * 60 * 1000;

/**
 * Long enough for genuinely long-form sections; short enough to stay non-streaming.
 *
 * A report once finished on 15,759 of 16,000 output tokens — 98% of the ceiling —
 * because adaptive thinking drew on the same budget. Truncation there is
 * particularly nasty: the tool-input JSON stops mid-object and an unfinished
 * report is indistinguishable in the response from a rule-based one.
 *
 * Thinking is now off (see `request` below), so this budget is prose only and
 * 20,000 is generous headroom. `max_tokens` is a ceiling, not a reservation — it
 * costs nothing unless the model spends it.
 */
const MAX_OUTPUT_TOKENS = 20000;

/**
 * Tool name → the `executeDataQuery` discriminator. Generation reuses
 * AiContextService's dispatcher rather than issuing its own Prisma queries, so
 * chat and reports can never disagree about what the database says.
 */
const DATA_TOOL_TYPES: Record<string, string> = {
  query_country_data: 'country_data',
  query_indicator_ranking: 'indicator_ranking',
  query_time_series: 'time_series',
  query_regional_average: 'regional_average',
  query_comparison: 'comparison',
  search_data: 'search',
};

const EMIT_TOOL = 'emit_report';

const BLOCK_TYPES = new Set([
  'paragraph',
  'bullets',
  'stat',
  'table',
  'chart',
  'callout',
]);

@Injectable()
export class InsightReportsService {
  private readonly logger = new Logger(InsightReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly aiContext: AiContextService,
    private readonly newsletter: NewsletterService,
    private readonly store: ReportStoreService,
  ) {}

  async getById(id: string): Promise<StoredReport> {
    const report = await this.store.get(id);
    if (!report) {
      throw new NotFoundException('Report not found. Generate it again to download or send.');
    }
    return report;
  }

  /**
   * Generate a cited, data-backed report. Claude gets read-only database tools
   * and emits a structured ReportDocument; if AI is unavailable or the loop
   * never produces a valid document, a deterministic report built from real
   * Prisma rows takes its place. Neither path invents a number.
   */
  async generate(opts: {
    scope: ReportScope;
    countryId?: string;
    themeId?: string;
    year?: number;
  }): Promise<StoredReport> {
    const scope = opts.scope;
    const id = randomUUID();

    let countryName: string | null = null;
    if (scope === 'country') {
      if (!opts.countryId) throw new BadRequestException('countryId is required for a country report');
      const c = await this.prisma.country.findUnique({
        where: { id: opts.countryId },
        select: { name: true },
      });
      if (!c) throw new NotFoundException(`Country ${opts.countryId} not found`);
      countryName = c.name;
    }
    let themeName: string | null = null;
    if (scope === 'theme') {
      if (!opts.themeId) throw new BadRequestException('themeId is required for a theme report');
      const t = await this.prisma.theme.findUnique({
        where: { id: opts.themeId },
        select: { name: true },
      });
      if (!t) throw new NotFoundException(`Theme ${opts.themeId} not found`);
      themeName = t.name;
    }

    const title =
      scope === 'country'
        ? `${countryName} — Youth Development Report`
        : scope === 'theme'
          ? `${themeName} Across Africa — Youth Data Report`
          : 'Africa Youth Development — Continental Report';

    // Reuse before spending. Identical requests were each running a full model
    // loop: six identical Nigeria/2024 reports during one debugging session cost
    // six generations and ~1.8M tokens, where one would have done. A report is a
    // derived artefact of the database, so the same request against unchanged data
    // has the same answer — and the endpoint is public, so without this a refresh
    // button is a spend button.
    const signature = this.requestSignature(scope, opts);
    const existingId = await this.store.findByRequest(signature, REPORT_REUSE_MS);
    if (existingId) {
      const existing = await this.store.get(existingId);
      // Only reuse a real AI document. Reusing a rule-based fallback would make a
      // transient AI outage permanent for that request.
      if (existing && existing.source === 'ai') {
        this.logger.log(
          `Reusing report ${existingId} for ${signature} (generated ${existing.createdAt})`,
        );
        return existing;
      }
    }

    let document: ReportDocument | null = null;
    let source: 'ai' | 'rule-based' = 'rule-based';
    let model: string | null = null;

    if (await this.ai.isAvailable()) {
      model = this.ai.getModel('report');
      try {
        document = await this.generateWithAi({ scope, countryName, themeName, title, ...opts });
        if (document) source = 'ai';
      } catch (e) {
        this.logger.warn(`AI report generation failed, falling back: ${(e as Error).message}`);
      }
    }

    if (!document) {
      document = await this.buildRuleBasedDocument(scope, title, countryName, themeName, opts.countryId, opts.year);
      source = 'rule-based';
      model = null;
    }

    const report: StoredReport = {
      id,
      scope,
      countryId: opts.countryId ?? null,
      themeId: opts.themeId ?? null,
      year: opts.year ?? null,
      document,
      html: renderReportHtml(document),
      source,
      model,
      createdAt: new Date().toISOString(),
      lastSentAt: null,
    };

    await this.store.save(report);

    // Only point at an AI report. Caching a rule-based fallback would turn a
    // momentary AI outage into a stale document served for the next 12 hours.
    if (source === 'ai') {
      await this.store.rememberRequest(signature, id);
    }

    return report;
  }

  /**
   * Render a stored report into one of the export formats. Binaries are cached
   * in the store because PDF/PPTX/XLSX rendering is the expensive half of a
   * download and the document they derive from is immutable.
   */
  async render(
    id: string,
    format: ReportFormat,
  ): Promise<{ filename: string; mime: string; body: Buffer }> {
    const report = await this.getById(id);
    const filename = `${this.safeFilename(report.document.title)}.${format}`;
    const mime = REPORT_MIME[format];

    const cached = await this.store.getRendered(id, format);
    if (cached) return { filename, mime, body: cached };

    const body =
      format === 'html'
        ? Buffer.from(renderStandaloneHtml(report.document), 'utf8')
        : format === 'pdf'
          ? await renderReportPdf(report.document)
          : format === 'pptx'
            ? await renderReportPptx(report.document)
            : await renderReportXlsx(report.document);

    await this.store.putRendered(id, format, body);
    return { filename, mime, body };
  }

  /**
   * Admin action: email a generated report to an audience. Maps the public
   * audience term to the NewsletterAudience enum and reuses the newsletter
   * dispatch pipeline (dedupe + per-recipient unsubscribe for subscribers).
   */
  async send(id: string, audience: 'subscribers' | 'users' | 'all'): Promise<{
    campaignId: string;
    audience: NewsletterAudience;
    recipientCount: number;
  }> {
    const report = await this.getById(id);
    const mapped: NewsletterAudience =
      audience === 'users' ? 'USERS' : audience === 'all' ? 'BOTH' : 'SUBSCRIBERS';

    const campaign = await this.newsletter.broadcastAdHoc({
      title: report.document.title,
      subject: report.document.title,
      bodyHtml: report.html,
      audience: mapped,
    });

    await this.store.save({ ...report, lastSentAt: new Date().toISOString() });

    return { campaignId: campaign.id, audience: mapped, recipientCount: campaign.recipientCount ?? 0 };
  }

  // ── AI generation ─────────────────────────────────────────────────────────

  private async generateWithAi(opts: {
    scope: ReportScope;
    countryName: string | null;
    themeName: string | null;
    title: string;
    countryId?: string;
    themeId?: string;
    year?: number;
  }): Promise<ReportDocument | null> {
    const client = await this.ai.getClient();
    if (!client) return null;

    const model = this.ai.getModel('report');
    const tools = this.buildTools();

    // A seed context so the model knows what exists before it starts querying;
    // it lives in the user turn, not the system prompt, so the cached prefix
    // (tools + system) stays byte-identical across every report we generate.
    const context =
      opts.scope === 'country' && opts.countryId
        ? await this.aiContext.buildCountryContext(opts.countryId)
        : await this.aiContext.buildFullContext();

    const userPrompt =
      `Report scope: ${opts.scope}` +
      `${opts.countryName ? ` (country: ${opts.countryName})` : ''}` +
      `${opts.themeName ? ` (theme: ${opts.themeName})` : ''}` +
      `${opts.year ? ` (focus year: ${opts.year})` : ''}.\n` +
      `Working title: ${opts.title}\n\n` +
      `Orientation snapshot of what the database currently holds — use the tools to ` +
      `pull the exact figures you cite:\n${context}\n\n` +
      `Query the data you need, then call ${EMIT_TOOL} with the finished report.`;

    let messages: any[] = [{ role: 'user', content: userPrompt }];
    const request = () =>
      client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        // Adaptive thinking and effort:high were set here on the reasoning that
        // reports are the low-volume, high-stakes surface. Measured, they were the
        // single largest cost item: thinking tokens bill as output, which is the
        // expensive side, and one report reached 15,759 output tokens where the
        // finished prose was a fraction of that. The accuracy guarantee in a
        // report comes from the tool loop fetching real figures and the validator
        // rejecting malformed output — not from the model thinking longer about a
        // number it has already been handed. Removed deliberately; re-adding
        // either one roughly triples the cost of every report.
        system: [
          {
            type: 'text',
            text: REPORT_SYSTEM_PROMPT,
            // tools + system are identical on every report request, so caching the
            // tail of the system block makes the whole repeated prefix ~90% cheaper.
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools,
        messages,
      });

    let response = await request();

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      if (response.stop_reason !== 'tool_use') break;

      const toolUses = response.content.filter((b: any) => b.type === 'tool_use');

      const emit = toolUses.find((b: any) => b.name === EMIT_TOOL);
      if (emit) {
        this.describeEmit(emit, response, iteration);
        const doc = this.coerceDocument(emit.input, opts.title);
        if (doc) {
          this.logger.log(`AI report emitted after ${iteration} data round-trip(s) on ${model}`);
          return doc;
        }
        this.logger.warn('Model emitted a report that failed validation — falling back');
        return null;
      }

      const toolResults: any[] = [];
      for (const toolUse of toolUses) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: this.capToolResult(
            JSON.stringify(await this.executeDataTool(toolUse.name, toolUse.input)),
            toolUse.name,
          ),
        });
      }

      // Last permitted round trip — say so, so the model spends it writing the
      // report instead of asking for data it will never receive.
      const isFinalRound = iteration === MAX_TOOL_ITERATIONS - 1;
      if (isFinalRound) {
        toolResults.push({
          type: 'text',
          text: `Data budget exhausted. Call ${EMIT_TOOL} now with the report built from what you already have.`,
        });
      }

      // Assistant content is echoed back verbatim so the model sees its own prior
      // turns intact.
      //
      // Then mark the newest tool_result as a cache breakpoint. Without this only
      // the static system+tools prefix was cached, and every iteration re-paid
      // full input price for the entire conversation so far — which is why six
      // reports cost 1.83M tokens. With it, each turn reads the previous turns at
      // 10% of input price and only the new content is charged in full.
      const lastResult = toolResults[toolResults.length - 1];
      if (lastResult) lastResult.cache_control = { type: 'ephemeral' };

      messages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];

      response = await request();
    }

    // The model may finish with emit_report in a non-tool_use stop (rare, but
    // cheap to honour rather than discarding a completed report).
    const trailing = response.content?.find(
      (b: any) => b.type === 'tool_use' && b.name === EMIT_TOOL,
    );
    if (trailing) {
      this.describeEmit(trailing, response, MAX_TOOL_ITERATIONS);
      const doc = this.coerceDocument(trailing.input, opts.title, 'trailing');
      if (doc) {
        this.logger.log(`AI report emitted on the final turn on ${model}`);
        return doc;
      }
      return null;
    }

    this.logger.warn(`Report loop ended without ${EMIT_TOOL} (stop_reason=${response.stop_reason})`);
    return null;
  }

  /**
   * Stable key for "the same report request": scope plus whichever of country,
   * theme and year apply. Year is included because a 2024 report and a 2025
   * report are different documents.
   */
  private requestSignature(
    scope: ReportScope,
    opts: { countryId?: string; themeId?: string; year?: number },
  ): string {
    return [
      scope,
      opts.countryId ?? 'no-country',
      opts.themeId ?? 'no-theme',
      opts.year ?? 'no-year',
    ].join('_');
  }

  /**
   * Caps a tool result before it enters the conversation.
   *
   * A tool result is not paid for once: it is resent on every later iteration, so
   * an oversized query response is charged three or four times over. These are
   * database reads that can return long row sets, and a report cites a handful of
   * figures from them. Truncating with an explicit marker lets the model narrow
   * its query instead of silently reasoning over a clipped array.
   */
  private capToolResult(json: string, toolName: string): string {
    if (json.length <= MAX_TOOL_RESULT_CHARS) return json;
    this.logger.warn(
      `Tool ${toolName} returned ${json.length} chars — truncated to ${MAX_TOOL_RESULT_CHARS}`,
    );
    return (
      json.slice(0, MAX_TOOL_RESULT_CHARS) +
      `\n\n[TRUNCATED: this result was ${json.length} characters. Narrow the query ` +
      `(fewer years, one country, or a specific indicator) if you need the rest.]`
    );
  }

  private async executeDataTool(toolName: string, input: any): Promise<any> {
    const type = DATA_TOOL_TYPES[toolName];
    if (!type) return { error: `Unknown tool "${toolName}"` };
    try {
      return await this.aiContext.executeDataQuery({ type: type as any, params: input ?? {} });
    } catch (err: any) {
      return { error: `Tool execution failed: ${err?.message ?? String(err)}` };
    }
  }

  /**
   * The six read-only data tools (mirroring the chat analyst's) plus the
   * terminal `emit_report`, whose schema is the ReportDocument contract.
   * Order and content must stay stable — the list is part of the cached prefix.
   */
  private buildTools(): any[] {
    return [
      {
        name: 'query_country_data',
        description: 'Get indicator data for a specific country.',
        input_schema: {
          type: 'object' as const,
          properties: {
            countryName: { type: 'string', description: 'Country name (e.g., "Nigeria")' },
            indicatorSlug: { type: 'string', description: 'Optional indicator slug (e.g., "youth-unemployment-rate")' },
            yearStart: { type: 'number', description: 'Optional start year' },
            yearEnd: { type: 'number', description: 'Optional end year' },
          },
          required: ['countryName'],
        },
      },
      {
        name: 'query_indicator_ranking',
        description: 'Get countries ranked by a specific indicator.',
        input_schema: {
          type: 'object' as const,
          properties: {
            indicatorSlug: { type: 'string', description: 'Indicator slug' },
            year: { type: 'number', description: 'Optional year (defaults to latest)' },
            limit: { type: 'number', description: 'Number of countries (default 10)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: '"desc" for highest first' },
          },
          required: ['indicatorSlug'],
        },
      },
      {
        name: 'query_time_series',
        description: 'Get historical trend data for an indicator in a country.',
        input_schema: {
          type: 'object' as const,
          properties: {
            countryName: { type: 'string' },
            indicatorSlug: { type: 'string' },
          },
          required: ['countryName', 'indicatorSlug'],
        },
      },
      {
        name: 'query_regional_average',
        description: 'Get the average value of an indicator across a region.',
        input_schema: {
          type: 'object' as const,
          properties: {
            region: {
              type: 'string',
              enum: ['NORTH_AFRICA', 'WEST_AFRICA', 'CENTRAL_AFRICA', 'EAST_AFRICA', 'SOUTHERN_AFRICA'],
            },
            indicatorSlug: { type: 'string' },
            year: { type: 'number', description: 'Optional year filter' },
          },
          required: ['region', 'indicatorSlug'],
        },
      },
      {
        name: 'query_comparison',
        description: 'Compare multiple countries across multiple indicators.',
        input_schema: {
          type: 'object' as const,
          properties: {
            countryNames: { type: 'array', items: { type: 'string' }, description: 'Country names to compare' },
            indicatorSlugs: { type: 'array', items: { type: 'string' }, description: 'Indicator slugs to compare on' },
          },
          required: ['countryNames', 'indicatorSlugs'],
        },
      },
      {
        name: 'search_data',
        description: 'Search for countries or indicators by name.',
        input_schema: {
          type: 'object' as const,
          properties: {
            term: { type: 'string', description: 'Search term' },
          },
          required: ['term'],
        },
      },
      {
        name: EMIT_TOOL,
        description:
          'Emit the finished report. Call this exactly once, as your final action, with the complete ' +
          'structured document. Every figure in it must come from a tool result you actually received.',
        input_schema: REPORT_DOCUMENT_SCHEMA,
      },
    ];
  }

  // ── Validation ────────────────────────────────────────────────────────────

  /**
   * Tool input is model-authored JSON, so it is treated as untrusted: unknown
   * block types are dropped rather than passed to renderers that would throw on
   * them, and `generatedAt` is always the server's clock.
   */
  /**
   * An array from a value that should be one, parsing a JSON string if that is
   * what arrived.
   *
   * Claude serialises a deeply nested tool argument as a JSON string rather than
   * as structured JSON often enough that treating it as malformed is simply
   * wrong. That is what broke report generation: the model returned a complete
   * report with `sections` as a string, the validator asked `Array.isArray`, got
   * false, and fell back to the rule-based document — so every report on the
   * platform read "generated without AI analysis" while the AI had in fact
   * written one. Parse it, then validate it exactly as before; a string that does
   * not parse to an array still fails.
   */
  private asArray(value: unknown): any[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* Not JSON. Falls through to the empty array and the caller reports it. */
      }
    }
    return [];
  }

  /**
   * Logs the shape of what the model handed us before validation runs.
   *
   * Exists because a rejected report is indistinguishable from a rule-based one
   * in the response, so the log is the only place the truth can live. The token
   * counts and stop_reason are here because output truncation is the likeliest
   * cause of a structurally complete but empty report: a `max_tokens` stop leaves
   * the tool-input JSON unfinished, and the SDK then surfaces the half-built
   * object rather than an error.
   */
  private describeEmit(emit: any, response: any, iteration: number): void {
    const raw = emit?.input;
    const sections = raw?.sections;
    this.logger.log(
      `${EMIT_TOOL} received on iteration ${iteration}: stop_reason=${response?.stop_reason}, ` +
        `sections=${Array.isArray(sections) ? `array(${sections.length})` : typeof sections}, ` +
        `summary=${typeof raw?.summary === 'string' ? `${raw.summary.length} chars` : typeof raw?.summary}, ` +
        `output_tokens=${response?.usage?.output_tokens ?? '?'}/${MAX_OUTPUT_TOKENS}`,
    );
    if (typeof sections === 'string') {
      this.logger.warn(
        `sections arrived as a ${sections.length}-char string. Head: ${sections.slice(0, 300)} | Tail: ${sections.slice(-120)}`,
      );
    }
  }

  /**
   * Validates untrusted model output into a ReportDocument, or explains why it
   * could not.
   *
   * Every rejection is logged with its reason. Without that, a report the model
   * wrote in full could be dropped on a single missing field and the caller
   * would serve the rule-based document instead — a 201 with plausible content
   * and no hint that the AI path had been discarded. `where` names the call site
   * so a rejection can be told from a rejection on the other path.
   */
  private coerceDocument(raw: any, fallbackTitle: string, where = 'emit'): ReportDocument | null {
    if (!raw || typeof raw !== 'object') {
      this.logger.warn(`Report rejected (${where}): tool input was ${typeof raw}, not an object`);
      return null;
    }

    const rawSections: any[] = this.asArray(raw.sections);
    const rejectedSections: string[] = [];
    const sections: ReportSection[] = rawSections
      .map((s: any): ReportSection | null => {
        const heading = this.str(s?.heading);
        const rawBlocks: any[] = this.asArray(s?.blocks);
        const blocks = rawBlocks.map((b: any) => this.coerceBlock(b)).filter(Boolean) as ReportBlock[];
        if (!heading || !blocks.length) {
          rejectedSections.push(
            `"${heading || '(no heading)'}": ${!heading ? 'missing heading' : `all ${rawBlocks.length} block(s) invalid (types: ${rawBlocks.map((b: any) => b?.type ?? typeof b).join(', ') || 'none'})`}`,
          );
          return null;
        }
        if (blocks.length < rawBlocks.length) {
          this.logger.warn(
            `Report section "${heading}" (${where}): dropped ${rawBlocks.length - blocks.length} of ${rawBlocks.length} block(s)`,
          );
        }
        return { heading, blocks };
      })
      .filter(Boolean) as ReportSection[];

    const summary = this.str(raw.summary);
    if (!sections.length || !summary) {
      const why = [
        !summary ? 'no usable summary' : null,
        !sections.length
          ? `no usable sections (received ${rawSections.length}${rejectedSections.length ? `; rejected — ${rejectedSections.join('; ')}` : ''})`
          : null,
      ]
        .filter(Boolean)
        .join('; ');
      this.logger.warn(`Report rejected (${where}): ${why}. Keys present: ${Object.keys(raw).join(', ') || 'none'}`);
      return null;
    }

    if (rejectedSections.length) {
      this.logger.warn(`Report accepted (${where}) with ${rejectedSections.length} section(s) dropped: ${rejectedSections.join('; ')}`);
    }

    const citations: ReportCitation[] = this.asArray(raw.citations)
      .map((c: any) => ({ label: this.str(c?.label), detail: this.str(c?.detail) }))
      .filter((c: ReportCitation) => c.label && c.detail);

    return {
      title: this.str(raw.title) || fallbackTitle,
      subtitle: this.str(raw.subtitle) || undefined,
      summary,
      sections,
      citations,
      generatedAt: new Date().toISOString(),
    };
  }

  private coerceBlock(raw: any): ReportBlock | null {
    if (!raw || typeof raw !== 'object' || !BLOCK_TYPES.has(raw.type)) return null;

    switch (raw.type) {
      case 'paragraph': {
        const text = this.str(raw.text);
        return text ? { type: 'paragraph', text } : null;
      }
      case 'bullets': {
        const items = this.asArray(raw.items).map((i: any) => this.str(i)).filter(Boolean);
        return items.length ? { type: 'bullets', items } : null;
      }
      case 'stat': {
        const label = this.str(raw.label);
        const value = this.str(raw.value);
        if (!label || !value) return null;
        return { type: 'stat', label, value, context: this.str(raw.context) || undefined };
      }
      case 'table': {
        const columns = this.asArray(raw.columns).map((c: any) => this.str(c));
        // Each row may itself have arrived as a JSON string, so coerce per row.
        const rows = this.asArray(raw.rows)
          .map((r: any) => this.asArray(r))
          .filter((r: any[]) => r.length)
          .map((r: any[]) =>
            r.map((cell) =>
              cell === null || cell === undefined
                ? null
                : typeof cell === 'number'
                  ? cell
                  : String(cell),
            ),
          );
        if (!columns.length || !rows.length) return null;
        return { type: 'table', columns, rows, caption: this.str(raw.caption) || undefined };
      }
      case 'chart': {
        const chartType = ['bar', 'line', 'pie'].includes(raw.chartType) ? raw.chartType : null;
        const categories = this.asArray(raw.categories).map((c: any) => this.str(c));
        const series = this.asArray(raw.series)
          .map((s: any) => ({
            name: this.str(s?.name),
            values: this.asArray(s?.values).map((v: any) =>
              typeof v === 'number' && Number.isFinite(v) ? v : null,
            ),
          }))
          .filter((s: any) => s.name && s.values.length);
        if (!chartType || !categories.length || !series.length) return null;
        return {
          type: 'chart',
          chartType,
          title: this.str(raw.title) || 'Chart',
          categories,
          series,
          unit: this.str(raw.unit) || undefined,
          sourceNote: this.str(raw.sourceNote) || undefined,
        };
      }
      case 'callout': {
        const text = this.str(raw.text);
        const tone = ['insight', 'warning', 'note'].includes(raw.tone) ? raw.tone : 'note';
        return text ? { type: 'callout', tone, text } : null;
      }
      default:
        return null;
    }
  }

  private str(v: unknown): string {
    return typeof v === 'string' ? v.trim() : '';
  }

  private safeFilename(title: string): string {
    return (title || 'report').replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, '_').slice(0, 120);
  }

  // ── Rule-based fallback ───────────────────────────────────────────────────

  /**
   * Deterministic document from real DB rows when AI is unavailable. It is
   * deliberately thin: only figures that exist in `youthIndexScore` appear, and
   * a missing row produces a "no data" note rather than a plausible-looking
   * placeholder.
   */
  private async buildRuleBasedDocument(
    scope: ReportScope,
    title: string,
    countryName: string | null,
    themeName: string | null,
    countryId?: string,
    year?: number,
  ): Promise<ReportDocument> {
    const latest = await this.prisma.youthIndexScore.findFirst({
      orderBy: { year: 'desc' },
      select: { year: true },
    });
    const useYear = year ?? latest?.year ?? null;

    const sections: ReportSection[] = [];
    const citations: ReportCitation[] = [];

    if (scope === 'country' && countryId) {
      const score = useYear
        ? await this.prisma.youthIndexScore.findFirst({
            where: { countryId, year: useYear },
            select: { overallScore: true, rank: true, tier: true, dimensionScores: true },
          })
        : null;

      const summary = score
        ? `${countryName ?? 'This country'} scores ${score.overallScore.toFixed(1)} on the African Youth Index for ${useYear}, ranking #${score.rank} continentally in the ${formatTierLabel(score.tier)} tier.`
        : `No African Youth Index score is available for ${countryName ?? 'this country'}${useYear ? ` in ${useYear}` : ''}. This summary reports only what the database holds.`;

      if (score) {
        sections.push({
          heading: `Youth Index — ${useYear}`,
          blocks: [
            { type: 'stat', label: 'Overall score', value: score.overallScore.toFixed(1), context: `African Youth Index, ${useYear}` },
            { type: 'stat', label: 'Continental rank', value: `#${score.rank}`, context: 'Out of all scored countries' },
            { type: 'stat', label: 'Tier', value: formatTierLabel(score.tier) },
          ],
        });
        citations.push({
          label: 'African Youth Index',
          detail: `${countryName ?? 'Country'} overall score, rank and tier, ${useYear}`,
        });

        const dims =
          score.dimensionScores && typeof score.dimensionScores === 'object'
            ? (score.dimensionScores as Record<string, unknown>)
            : {};
        const rows = Object.entries(dims)
          .filter(([, v]) => Number.isFinite(Number(v)))
          .map(([k, v]) => [formatDimensionLabel(k), Number(Number(v).toFixed(1))] as (string | number)[]);
        if (rows.length) {
          sections.push({
            heading: 'Dimension scores',
            blocks: [
              {
                type: 'table',
                columns: ['Dimension', 'Score'],
                rows,
                caption: `African Youth Index dimension breakdown, ${useYear}`,
              },
            ],
          });
          citations.push({
            label: 'African Youth Index — dimensions',
            detail: `${rows.length} dimension scores, ${useYear}`,
          });
        }
      } else {
        sections.push({
          heading: 'Data availability',
          blocks: [
            {
              type: 'callout',
              tone: 'warning',
              text: `No Youth Index score is recorded for ${countryName ?? 'this country'}${useYear ? ` in ${useYear}` : ''}.`,
            },
          ],
        });
      }

      return {
        title,
        subtitle: 'Statistical summary generated without AI analysis',
        summary,
        sections,
        citations,
        generatedAt: new Date().toISOString(),
      };
    }

    // Continental / theme fallback: the actual ranking table, nothing more.
    const top = useYear
      ? await this.prisma.youthIndexScore.findMany({
          where: { year: useYear },
          orderBy: { rank: 'asc' },
          take: 10,
          include: { country: { select: { name: true, flagEmoji: true } } },
        })
      : [];

    const summary = top.length
      ? `A continental snapshot of youth development for ${useYear}, based on the African Youth Index. ${top[0].country?.name ?? 'The leading country'} leads with ${top[0].overallScore.toFixed(1)}.`
      : 'No African Youth Index data is available yet, so this summary reports data availability only.';

    if (top.length) {
      sections.push({
        heading: `Top 10 — African Youth Index ${useYear}`,
        blocks: [
          {
            type: 'table',
            columns: ['Rank', 'Country', 'Score'],
            rows: top.map((t) => [
              t.rank,
              // No flagEmoji: the PDF renderer uses only WinAnsi-encoded Helvetica,
              // so a regional-indicator pair prints as mojibake in every row.
              stripNonWinAnsi(t.country?.name ?? 'Unknown'),
              Number(t.overallScore.toFixed(1)),
            ]),
            caption: `African Youth Index rankings, ${useYear}`,
          },
          {
            type: 'chart',
            chartType: 'bar',
            title: `Top 10 overall scores — ${useYear}`,
            categories: top.map((t) => t.country?.name ?? 'Unknown'),
            series: [{ name: 'Overall score', values: top.map((t) => Number(t.overallScore.toFixed(1))) }],
            sourceNote: 'African Youth Index',
          },
        ],
      });
      citations.push({
        label: 'African Youth Index',
        detail: `Top 10 country rankings and overall scores, ${useYear}`,
      });
    } else {
      sections.push({
        heading: 'Data availability',
        blocks: [
          { type: 'callout', tone: 'warning', text: 'No African Youth Index scores are recorded in the database.' },
        ],
      });
    }

    return {
      title,
      subtitle: themeName
        ? `${themeName} — statistical summary generated without AI analysis`
        : 'Statistical summary generated without AI analysis',
      summary,
      sections,
      citations,
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Frozen: this string plus the tool list form the cached request prefix. Any
 * per-report detail belongs in the user turn, not here — editing this on every
 * request would silently cost us the cache hit.
 */
const REPORT_SYSTEM_PROMPT = [
  'You are the lead analyst for the African Youth Observatory (AYO), writing a formal, cited data report',
  'for policymakers, researchers, and civil-society leaders across all 54 African nations.',
  '',
  'HOW YOU WORK',
  'You have read-only tools onto the live AYO database. Query them for every figure you intend to state.',
  'Never recall, estimate, extrapolate, or round a number you were not given by a tool result. If the data',
  'you want does not exist, say so in the report — a stated gap is a finding, an invented number is a defect.',
  'Attach a year to every statistic. Be analytical: explain why a pattern exists and what should be done',
  'about it, not merely what the number is.',
  '',
  'HOW YOU FINISH',
  `When you have the data you need, call ${EMIT_TOOL} exactly once with the complete structured report.`,
  'Do not write the report as prose in a text block — only the emit_report call is read.',
  '',
  'REPORT SHAPE',
  'Aim for 4–7 sections, opening with an executive framing and closing with recommendations.',
  'Use the block types deliberately: `stat` for headline figures, `table` for rankings and comparisons,',
  '`chart` for trends and cross-country distributions, `bullets` for findings and recommendations,',
  '`callout` for the one or two claims that most deserve a reader\'s attention, and `paragraph` for analysis.',
  'A section of nothing but paragraphs is a wasted section. Populate `citations` with one entry per',
  'indicator/year family you drew on, so every figure is traceable.',
].join('\n');

/**
 * The `emit_report` input schema — a direct JSON Schema transcription of the
 * `ReportDocument` contract in report-document.model.ts. Keep the two in sync;
 * anything the schema permits but the contract does not is dropped by
 * `coerceDocument`.
 */
const REPORT_DOCUMENT_SCHEMA = {
  type: 'object' as const,
  properties: {
    title: { type: 'string', description: 'Report title.' },
    subtitle: { type: 'string', description: 'Optional one-line subtitle.' },
    summary: {
      type: 'string',
      description: 'Plain-text executive summary, 2–4 sentences. No markup — renderers style it.',
    },
    sections: {
      type: 'array',
      description: 'Ordered report sections, 4–7 of them.',
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          blocks: {
            type: 'array',
            description: 'Ordered content blocks for this section.',
            items: {
              anyOf: [
                {
                  type: 'object',
                  description: 'A paragraph of analytical prose.',
                  properties: {
                    type: { type: 'string', enum: ['paragraph'] },
                    text: { type: 'string' },
                  },
                  required: ['type', 'text'],
                },
                {
                  type: 'object',
                  description: 'A bulleted list of findings or recommendations.',
                  properties: {
                    type: { type: 'string', enum: ['bullets'] },
                    items: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['type', 'items'],
                },
                {
                  type: 'object',
                  description: 'A headline figure. `value` is pre-formatted for display, e.g. "62.4%".',
                  properties: {
                    type: { type: 'string', enum: ['stat'] },
                    label: { type: 'string' },
                    value: { type: 'string' },
                    context: { type: 'string', description: 'Optional qualifier, e.g. "African Youth Index, 2023".' },
                  },
                  required: ['type', 'label', 'value'],
                },
                {
                  type: 'object',
                  description: 'A data table. Every row must have the same length as `columns`.',
                  properties: {
                    type: { type: 'string', enum: ['table'] },
                    columns: { type: 'array', items: { type: 'string' } },
                    rows: {
                      type: 'array',
                      items: { type: 'array', items: { type: ['string', 'number', 'null'] } },
                    },
                    caption: { type: 'string' },
                  },
                  required: ['type', 'columns', 'rows'],
                },
                {
                  type: 'object',
                  description: 'A chart the renderers draw natively. `values` is index-aligned to `categories`.',
                  properties: {
                    type: { type: 'string', enum: ['chart'] },
                    chartType: { type: 'string', enum: ['bar', 'line', 'pie'] },
                    title: { type: 'string' },
                    categories: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'X-axis labels (years, country names, ...).',
                    },
                    series: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          values: {
                            type: 'array',
                            items: { type: ['number', 'null'] },
                            description: 'Use null for a missing observation — never a guess.',
                          },
                        },
                        required: ['name', 'values'],
                      },
                    },
                    unit: { type: 'string', description: 'Unit shown on the value axis, e.g. "%".' },
                    sourceNote: { type: 'string' },
                  },
                  required: ['type', 'chartType', 'title', 'categories', 'series'],
                },
                {
                  type: 'object',
                  description: 'A highlighted remark.',
                  properties: {
                    type: { type: 'string', enum: ['callout'] },
                    tone: { type: 'string', enum: ['insight', 'warning', 'note'] },
                    text: { type: 'string' },
                  },
                  required: ['type', 'tone', 'text'],
                },
              ],
            },
          },
        },
        required: ['heading', 'blocks'],
      },
    },
    citations: {
      type: 'array',
      description: 'Where the figures came from — one entry per indicator/year family used.',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Indicator or dataset name.' },
          detail: { type: 'string', description: 'What was drawn from it, including the year(s).' },
        },
        required: ['label', 'detail'],
      },
    },
    generatedAt: {
      type: 'string',
      description: 'ISO 8601 timestamp. The server overwrites this with its own clock.',
    },
  },
  required: ['title', 'summary', 'sections', 'citations', 'generatedAt'],
};
