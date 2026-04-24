import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDashboardDto, UpdateDashboardDto, ListPublicDashboardsDto } from './dashboards.dto';

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateDashboardDto) {
    const dashboard = await this.prisma.dashboard.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        isPublic: dto.isPublic || false,
        widgets: dto.widgets ? JSON.parse(JSON.stringify(dto.widgets)) : [],
        userId,
      },
    });

    return this.formatDashboard(dashboard);
  }

  async listUserDashboards(userId: string) {
    const dashboards = await this.prisma.dashboard.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return dashboards.map((d) => this.formatDashboard(d));
  }

  async listPublicDashboards(dto: ListPublicDashboardsDto) {
    const { page = 1, pageSize = 20, search } = dto;

    const where: Record<string, unknown> = { isPublic: true };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [dashboards, total] = await Promise.all([
      this.prisma.dashboard.findMany({
        where,
        include: {
          user: { select: { name: true, organization: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.dashboard.count({ where }),
    ]);

    return {
      data: dashboards.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        widgetCount: Array.isArray(d.widgets) ? (d.widgets as unknown[]).length : 0,
        creatorName: d.user.name,
        creatorOrganization: d.user.organization,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getDashboard(id: string, requestingUserId?: string) {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, organization: true } },
      },
    });

    if (!dashboard) throw new NotFoundException('Dashboard not found');

    // Check access
    if (!dashboard.isPublic && dashboard.userId !== requestingUserId) {
      throw new ForbiddenException('Access denied to this dashboard');
    }

    return {
      id: dashboard.id,
      title: dashboard.title,
      description: dashboard.description,
      isPublic: dashboard.isPublic,
      layout: dashboard.layout,
      widgets: dashboard.widgets,
      creatorName: dashboard.user.name,
      creatorOrganization: dashboard.user.organization,
      userId: dashboard.userId,
      createdAt: dashboard.createdAt.toISOString(),
      updatedAt: dashboard.updatedAt.toISOString(),
    };
  }

  async update(id: string, userId: string, dto: UpdateDashboardDto) {
    const dashboard = await this.prisma.dashboard.findUnique({ where: { id } });
    if (!dashboard) throw new NotFoundException('Dashboard not found');
    if (dashboard.userId !== userId) throw new ForbiddenException('Not the owner of this dashboard');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;
    if (dto.layout !== undefined) data.layout = dto.layout;
    if (dto.widgets !== undefined) data.widgets = JSON.parse(JSON.stringify(dto.widgets));

    const updated = await this.prisma.dashboard.update({
      where: { id },
      data,
    });

    return this.formatDashboard(updated);
  }

  async delete(id: string, userId: string) {
    const dashboard = await this.prisma.dashboard.findUnique({ where: { id } });
    if (!dashboard) throw new NotFoundException('Dashboard not found');
    if (dashboard.userId !== userId) throw new ForbiddenException('Not the owner of this dashboard');

    await this.prisma.dashboard.delete({ where: { id } });
    return { message: 'Dashboard deleted' };
  }

  async clone(id: string, newUserId: string) {
    const original = await this.prisma.dashboard.findUnique({ where: { id } });
    if (!original) throw new NotFoundException('Dashboard not found');
    if (!original.isPublic && original.userId !== newUserId) {
      throw new ForbiddenException('Cannot clone a private dashboard you do not own');
    }

    const cloned = await this.prisma.dashboard.create({
      data: {
        title: `Copy of ${original.title}`,
        description: original.description,
        isPublic: false,
        layout: original.layout as any,
        widgets: original.widgets as any,
        userId: newUserId,
      },
    });

    return this.formatDashboard(cloned);
  }

  private formatDashboard(d: {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    layout: unknown;
    widgets: unknown;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      isPublic: d.isPublic,
      layout: d.layout,
      widgets: d.widgets,
      userId: d.userId,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }
}
