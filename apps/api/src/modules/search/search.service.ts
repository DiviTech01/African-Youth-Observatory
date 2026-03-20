import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';

interface SearchHit {
  id: string;
  type: 'country' | 'indicator' | 'theme' | 'expert' | 'dashboard';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  relevance: number;
  icon?: string;
}

const ALL_TYPES = ['countries', 'indicators', 'themes', 'experts', 'dashboards'];

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async search(query: string, typesStr?: string, limit: number = 5) {
    const start = Date.now();
    const q = query.trim().toLowerCase();

    const cacheKey = this.cache.buildKey('search', { q, types: typesStr, limit });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const types = typesStr
      ? typesStr.split(',').map((t) => t.trim()).filter((t) => ALL_TYPES.includes(t))
      : ALL_TYPES;

    // Run all searches in parallel
    const [countries, indicators, themes, experts, dashboards] = await Promise.all([
      types.includes('countries') ? this.searchCountries(q, limit) : [],
      types.includes('indicators') ? this.searchIndicators(q, limit) : [],
      types.includes('themes') ? this.searchThemes(q, limit) : [],
      types.includes('experts') ? this.searchExperts(q, limit) : [],
      types.includes('dashboards') ? this.searchDashboards(q, limit) : [],
    ]);

    const totalResults =
      countries.length + indicators.length + themes.length + experts.length + dashboards.length;

    const result = {
      query,
      totalResults,
      results: { countries, indicators, themes, experts, dashboards },
      processingTime: Date.now() - start,
    };

    this.cache.set(cacheKey, result, 300); // 5 min cache
    return result;
  }

  private async searchCountries(q: string, limit: number): Promise<SearchHit[]> {
    const countries = await this.prisma.country.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { capital: { contains: q, mode: 'insensitive' } },
          { isoCode2: { equals: q, mode: 'insensitive' } },
          { isoCode3: { equals: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, isoCode3: true, region: true, capital: true, flagEmoji: true },
      take: limit * 2, // fetch extra for re-ranking
    });

    return countries
      .map((c) => ({
        id: c.id,
        type: 'country' as const,
        title: c.name,
        subtitle: this.formatRegion(c.region) + (c.capital ? ` · ${c.capital}` : ''),
        description: `${c.isoCode3}`,
        url: `/countries/${c.id}`,
        relevance: this.scoreRelevance(q, c.name, [c.capital, c.isoCode2, c.isoCode3]),
        icon: c.flagEmoji || undefined,
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  private async searchIndicators(q: string, limit: number): Promise<SearchHit[]> {
    const indicators = await this.prisma.indicator.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { theme: { select: { name: true } } },
      take: limit * 2,
    });

    return indicators
      .map((i) => ({
        id: i.id,
        type: 'indicator' as const,
        title: i.name,
        subtitle: i.theme?.name || undefined,
        description: i.description?.slice(0, 120) || undefined,
        url: `/explore?indicator=${i.slug}`,
        relevance: this.scoreRelevance(q, i.name, [i.slug, i.description || '']),
        icon: undefined,
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  private async searchThemes(q: string, limit: number): Promise<SearchHit[]> {
    const themes = await this.prisma.theme.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, slug: true, description: true, icon: true },
      take: limit * 2,
    });

    return themes
      .map((t) => ({
        id: t.id,
        type: 'theme' as const,
        title: t.name,
        subtitle: undefined,
        description: t.description?.slice(0, 120) || undefined,
        url: `/explore?theme=${t.slug}`,
        relevance: this.scoreRelevance(q, t.name, [t.description || '']),
        icon: t.icon || undefined,
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  private async searchExperts(q: string, limit: number): Promise<SearchHit[]> {
    const experts = await this.prisma.expert.findMany({
      where: {
        verified: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { organization: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { country: { select: { name: true } } },
      take: limit * 2,
    });

    return experts
      .map((e) => ({
        id: e.id,
        type: 'expert' as const,
        title: e.name,
        subtitle: `${e.title}${e.organization ? ` · ${e.organization}` : ''}`,
        description: e.country.name,
        url: `/experts/${e.id}`,
        relevance: this.scoreRelevance(q, e.name, [e.title, e.organization || '', e.bio || '']),
        icon: undefined,
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  private async searchDashboards(q: string, limit: number): Promise<SearchHit[]> {
    const dashboards = await this.prisma.dashboard.findMany({
      where: {
        isPublic: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, description: true },
      take: limit * 2,
    });

    return dashboards
      .map((d) => ({
        id: d.id,
        type: 'dashboard' as const,
        title: d.title,
        subtitle: undefined,
        description: d.description?.slice(0, 120) || undefined,
        url: `/dashboards/${d.id}`,
        relevance: this.scoreRelevance(q, d.title, [d.description || '']),
        icon: undefined,
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Score relevance: exact match → 1.0, starts with → 0.9, contains → 0.7, other field → 0.5
   */
  private scoreRelevance(query: string, primaryField: string, otherFields: string[]): number {
    const primary = primaryField.toLowerCase();
    if (primary === query) return 1.0;
    if (primary.startsWith(query)) return 0.9;
    if (primary.includes(query)) return 0.7;

    for (const field of otherFields) {
      if (field.toLowerCase().includes(query)) return 0.5;
    }

    return 0.3;
  }

  private formatRegion(region: string): string {
    return region
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }
}
