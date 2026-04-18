import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache.service';
import { ExpertSearchDto, CreateExpertDto, UpdateExpertDto } from './expert-directory.dto';

// Predefined specialization categories for the platform
export const SPECIALIZATIONS = [
  'Youth Employment',
  'Labor Markets',
  'Skills Development',
  'Development Economics',
  'Youth Entrepreneurship',
  'Financial Inclusion',
  'Youth Policy',
  'AYC Implementation',
  'Governance',
  'Youth Health',
  'Reproductive Health',
  'Health Systems',
  'Education Policy',
  'TVET',
  'Digital Literacy',
  'Data Science',
  'Youth Statistics',
  'Survey Methodology',
  'Gender Equality',
  'Youth Empowerment',
  'Women in STEM',
  'Innovation',
  'Digital Economy',
  'Startup Ecosystems',
  'Youth in Agriculture',
  'Rural Development',
  'Food Security',
  'Civic Participation',
  'Peace Building',
  'Youth Governance',
  'Climate Change',
  'Environmental Policy',
  'Green Jobs',
  'Regional Integration',
  'Youth Mobility',
  'Migration',
  'Displacement',
  'Youth Resilience',
  'Mobile Money',
  'Youth Savings',
  'Demography',
  'Population Studies',
  'Education Finance',
  'Higher Education',
  'Digital Rights',
  'Social Protection',
  'Youth Mental Health',
  'Nutrition',
  'ICT Development',
  'Girls Education',
  'STEM Education',
];

@Injectable()
export class ExpertDirectoryService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Search and list experts with filtering, pagination, and full-text search.
   */
  async search(dto: ExpertSearchDto) {
    const {
      search,
      countryId,
      region,
      specialization,
      language,
      verified,
      page = 1,
      pageSize = 20,
    } = dto;

    const where: Record<string, unknown> = {};

    // Country filter
    if (countryId) {
      where.countryId = countryId;
    }

    // Region filter (through country relation)
    if (region) {
      where.country = { region };
    }

    // Verification filter
    if (verified !== undefined) {
      where.verified = verified;
    }

    // Specialization filter (array contains)
    if (specialization) {
      where.specializations = { has: specialization };
    }

    // Language filter (array contains)
    if (language) {
      where.languages = { has: language };
    }

    // Text search across name, title, organization, bio
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [experts, total] = await Promise.all([
      this.prisma.expert.findMany({
        where,
        include: {
          country: {
            select: { id: true, name: true, isoCode3: true, region: true, flagEmoji: true },
          },
        },
        orderBy: [{ verified: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expert.count({ where }),
    ]);

    return {
      data: experts.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.verified ? e.email : null, // Only show email for verified experts
        title: e.title,
        organization: e.organization,
        country: e.country,
        specializations: e.specializations,
        languages: e.languages,
        bio: e.bio,
        verified: e.verified,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single expert by ID.
   */
  async getById(id: string) {
    const expert = await this.prisma.expert.findUnique({
      where: { id },
      include: {
        country: {
          select: { id: true, name: true, isoCode3: true, region: true, flagEmoji: true },
        },
      },
    });

    if (!expert) {
      throw new NotFoundException(`Expert ${id} not found`);
    }

    return {
      id: expert.id,
      name: expert.name,
      email: expert.email,
      title: expert.title,
      organization: expert.organization,
      country: expert.country,
      specializations: expert.specializations,
      languages: expert.languages,
      bio: expert.bio,
      verified: expert.verified,
      createdAt: expert.createdAt.toISOString(),
    };
  }

  /**
   * Register a new expert (public registration, starts unverified).
   */
  async create(dto: CreateExpertDto) {
    // Check for duplicate email
    if (dto.email) {
      const existing = await this.prisma.expert.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException(`An expert with email ${dto.email} already exists`);
      }
    }

    // Verify country exists
    const country = await this.prisma.country.findUnique({
      where: { id: dto.countryId },
    });
    if (!country) {
      throw new NotFoundException(`Country ${dto.countryId} not found`);
    }

    const expert = await this.prisma.expert.create({
      data: {
        name: dto.name,
        email: dto.email,
        title: dto.title,
        organization: dto.organization,
        countryId: dto.countryId,
        specializations: dto.specializations,
        languages: dto.languages,
        bio: dto.bio,
        verified: false,
        status: 'PENDING',
      },
      include: {
        country: {
          select: { id: true, name: true, isoCode3: true, region: true, flagEmoji: true },
        },
      },
    });

    this.cache.clearPrefix('expert:');

    // Log notification (email sending would be handled by a notification service)
    console.log(`[Expert Registration] New expert registered: ${expert.name} (${expert.email})`);
    console.log(`[Expert Registration] Admin notification: New expert pending approval - ${expert.name}`);

    return {
      id: expert.id,
      name: expert.name,
      email: expert.email,
      title: expert.title,
      organization: expert.organization,
      country: expert.country,
      specializations: expert.specializations,
      languages: expert.languages,
      bio: expert.bio,
      verified: expert.verified,
      status: (expert as any).status || 'PENDING',
      createdAt: expert.createdAt.toISOString(),
      message: 'Registration submitted successfully. You will receive a confirmation email shortly.',
    };
  }

  /**
   * Update an expert. Admin can update any field including verified status.
   */
  async update(id: string, dto: UpdateExpertDto) {
    const existing = await this.prisma.expert.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Expert ${id} not found`);
    }

    // Check email uniqueness if changing
    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.expert.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken) {
        throw new ConflictException(`An expert with email ${dto.email} already exists`);
      }
    }

    // Verify country if changing
    if (dto.countryId) {
      const country = await this.prisma.country.findUnique({
        where: { id: dto.countryId },
      });
      if (!country) {
        throw new NotFoundException(`Country ${dto.countryId} not found`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.organization !== undefined) updateData.organization = dto.organization;
    if (dto.countryId !== undefined) updateData.countryId = dto.countryId;
    if (dto.specializations !== undefined) updateData.specializations = dto.specializations;
    if (dto.languages !== undefined) updateData.languages = dto.languages;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.verified !== undefined) updateData.verified = dto.verified;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      // Auto-verify on approval
      if (dto.status === 'APPROVED') {
        updateData.verified = true;
      }
    }
    if (dto.rejectionReason !== undefined) updateData.rejectionReason = dto.rejectionReason;

    const updated = await this.prisma.expert.update({
      where: { id },
      data: updateData,
      include: {
        country: {
          select: { id: true, name: true, isoCode3: true, region: true, flagEmoji: true },
        },
      },
    });

    this.cache.clearPrefix('expert:');

    // Log approval/rejection notification
    if (dto.status === 'APPROVED') {
      console.log(`[Expert Approval] Expert approved: ${updated.name} (${updated.email})`);
      console.log(`[Expert Approval] Email notification sent to ${updated.email}: Your expert profile has been approved!`);
    } else if (dto.status === 'REJECTED') {
      console.log(`[Expert Rejection] Expert rejected: ${updated.name} (${updated.email})`);
      console.log(`[Expert Rejection] Email notification sent to ${updated.email}: Your registration was not approved. Reason: ${dto.rejectionReason || 'Not specified'}`);
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      title: updated.title,
      organization: updated.organization,
      country: updated.country,
      specializations: updated.specializations,
      languages: updated.languages,
      bio: updated.bio,
      verified: updated.verified,
      status: (updated as any).status,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Delete an expert (admin only).
   */
  async delete(id: string) {
    const existing = await this.prisma.expert.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Expert ${id} not found`);
    }

    await this.prisma.expert.delete({ where: { id } });
    this.cache.clearPrefix('expert:');

    return { message: `Expert ${id} deleted` };
  }

  /**
   * Get expert directory statistics.
   */
  async getStats() {
    const cacheKey = 'expert:stats';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const [
      totalExperts,
      verifiedExperts,
      experts,
    ] = await Promise.all([
      this.prisma.expert.count(),
      this.prisma.expert.count({ where: { verified: true } }),
      this.prisma.expert.findMany({
        include: {
          country: { select: { region: true } },
        },
      }),
    ]);

    // Region distribution
    const regionCounts = new Map<string, number>();
    const specializationCounts = new Map<string, number>();
    const languageCounts = new Map<string, number>();
    const organizationSet = new Set<string>();

    for (const expert of experts) {
      const region = expert.country.region;
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);

      for (const spec of expert.specializations) {
        specializationCounts.set(spec, (specializationCounts.get(spec) || 0) + 1);
      }

      for (const lang of expert.languages) {
        languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
      }

      if (expert.organization) {
        organizationSet.add(expert.organization);
      }
    }

    // Top specializations
    const topSpecializations = Array.from(specializationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Top languages
    const topLanguages = Array.from(languageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const result = {
      totalExperts,
      verifiedExperts,
      verificationRate: totalExperts > 0
        ? Math.round((verifiedExperts / totalExperts) * 10000) / 100
        : 0,
      uniqueOrganizations: organizationSet.size,
      byRegion: Object.fromEntries(
        ['NORTH_AFRICA', 'WEST_AFRICA', 'CENTRAL_AFRICA', 'EAST_AFRICA', 'SOUTHERN_AFRICA'].map(
          (r) => [r, regionCounts.get(r) || 0],
        ),
      ),
      topSpecializations,
      topLanguages,
      availableSpecializations: SPECIALIZATIONS,
    };

    this.cache.set(cacheKey, result, 300);
    return result;
  }
}
