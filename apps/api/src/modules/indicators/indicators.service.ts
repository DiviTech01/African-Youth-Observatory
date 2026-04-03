import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { ListIndicatorsDto, IndicatorValuesQueryDto } from './indicators.dto';

@Injectable()
export class IndicatorsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll(query: ListIndicatorsDto) {
    const { themeId, search, page = 1, pageSize = 50 } = query;

    const cacheKey = this.cache.buildKey('indicators:list', { themeId, search, page, pageSize });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {};
    if (themeId) where.themeId = themeId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.indicator.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { theme: { select: { name: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.indicator.count({ where }),
    ]);

    const result = {
      data: data.map((d) => ({
        ...d,
        themeName: d.theme.name,
        theme: undefined,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    this.cache.set(cacheKey, result, 3600);
    return result;
  }

  async findById(id: string) {
    const indicator = await this.prisma.indicator.findUnique({
      where: { id },
      include: { theme: true },
    });
    if (!indicator)
      throw new NotFoundException(`Indicator ${id} not found`);
    return indicator;
  }

  async getValues(id: string, query: IndicatorValuesQueryDto) {
    const indicator = await this.findById(id);
    const { countryId, yearStart, yearEnd, gender, page = 1, pageSize = 100 } = query;

    const where: Record<string, unknown> = { indicatorId: id };
    if (countryId) where.countryId = countryId;
    if (gender) where.gender = gender;
    if (yearStart || yearEnd) {
      where.year = {};
      if (yearStart) (where.year as Record<string, number>).gte = yearStart;
      if (yearEnd) (where.year as Record<string, number>).lte = yearEnd;
    }

    const [data, total] = await Promise.all([
      this.prisma.indicatorValue.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          country: { select: { name: true, isoCode3: true, flagEmoji: true } },
        },
        orderBy: [{ year: 'desc' }, { country: { name: 'asc' } }],
      }),
      this.prisma.indicatorValue.count({ where }),
    ]);

    return {
      indicator: { id: indicator.id, name: indicator.name, unit: indicator.unit },
      data: data.map((v) => ({
        ...v,
        countryName: v.country.name,
        isoCode3: v.country.isoCode3,
        country: undefined,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
