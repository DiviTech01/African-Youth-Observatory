import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';
import { CreateDashboardDto, UpdateDashboardDto, ListPublicDashboardsDto } from './dashboards.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('dashboards')
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new dashboard' })
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateDashboardDto) {
    return this.dashboardsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current user dashboards' })
  listMine(@Request() req: { user: { id: string } }) {
    return this.dashboardsService.listUserDashboards(req.user.id);
  }

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List public dashboards (no auth required)' })
  listPublic(@Query() dto: ListPublicDashboardsDto) {
    return this.dashboardsService.listPublicDashboards(dto);
  }

  @Public()
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Dashboard ID' })
  @ApiOperation({ summary: 'Get a single dashboard (public or owned)' })
  getOne(@Param('id') id: string, @Request() req: { user?: { id: string } }) {
    return this.dashboardsService.getDashboard(id, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Dashboard ID' })
  @ApiOperation({ summary: 'Update a dashboard (owner only)' })
  update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateDashboardDto,
  ) {
    return this.dashboardsService.update(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Dashboard ID' })
  @ApiOperation({ summary: 'Delete a dashboard (owner only)' })
  delete(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.dashboardsService.delete(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/clone')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Dashboard ID to clone' })
  @ApiOperation({ summary: 'Clone a public dashboard to your account' })
  clone(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.dashboardsService.clone(id, req.user.id);
  }
}
