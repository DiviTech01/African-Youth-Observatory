// ============================================
// AFRICAN YOUTH OBSERVATORY - DASHBOARD BUILDER
// Customizable dashboard with draggable widgets
// ============================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Settings,
  Trash2,
  MoreVertical,
  LayoutDashboard,
  Save,
  Copy,
  Maximize2,
  Minimize2,
  GripVertical,
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Map,
  BarChart3,
  Flag,
  Activity,
  Globe,
  PieChart,
  Lightbulb,
  Table,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  type DashboardConfig,
  type DashboardWidget,
  type WidgetType,
  type WidgetSize,
  type WidgetData,
  WIDGET_TEMPLATES,
  DEFAULT_DASHBOARDS,
  getAllDashboards,
  getDashboard,
  getActiveDashboard,
  setActiveDashboard,
  saveDashboard,
  createDashboard,
  deleteDashboard,
  addWidget,
  removeWidget,
  updateWidget,
  getWidgetData,
} from '@/services/dashboard';
import { getHighPriorityInsights } from '@/services/insights';
import { InsightCard } from '@/components/insights';
import { AFRICAN_COUNTRIES, THEMES } from '@/types';
import { cn } from '@/lib/utils';

// ============================================
// WIDGET ICON MAPPING
// ============================================

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  'youth-index-ranking': <Trophy className="h-4 w-4" />,
  'top-countries': <TrendingUp className="h-4 w-4" />,
  'bottom-countries': <AlertTriangle className="h-4 w-4" />,
  'regional-comparison': <Map className="h-4 w-4" />,
  'indicator-chart': <BarChart3 className="h-4 w-4" />,
  'country-spotlight': <Flag className="h-4 w-4" />,
  'trend-analysis': <TrendingUp className="h-4 w-4" />,
  'quick-stats': <Activity className="h-4 w-4" />,
  'map-overview': <Globe className="h-4 w-4" />,
  'theme-breakdown': <PieChart className="h-4 w-4" />,
  'recent-insights': <Lightbulb className="h-4 w-4" />,
  'data-table': <Table className="h-4 w-4" />,
};

// ============================================
// SIZE CLASSES
// ============================================

const SIZE_CLASSES: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-1 md:col-span-2 lg:col-span-3',
  full: 'col-span-1 md:col-span-2 lg:col-span-4',
};

// ============================================
// WIDGET CONTENT RENDERERS
// ============================================

interface WidgetContentProps {
  widget: DashboardWidget;
  data: WidgetData;
  isEditing: boolean;
}

const QuickStatsWidget: React.FC<{ data: any }> = ({ data }) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="text-center p-3 bg-muted rounded-lg">
      <div className="text-2xl font-bold text-primary">{data.totalCountries}</div>
      <div className="text-xs text-muted-foreground">Countries</div>
    </div>
    <div className="text-center p-3 bg-muted rounded-lg">
      <div className="text-2xl font-bold text-green-600">{data.averageScore}</div>
      <div className="text-xs text-muted-foreground">Avg Score</div>
    </div>
    <div className="text-center p-3 bg-muted rounded-lg">
      <div className="text-2xl font-bold text-blue-600">{data.totalIndicators}</div>
      <div className="text-xs text-muted-foreground">Indicators</div>
    </div>
    <div className="text-center p-3 bg-muted rounded-lg">
      <div className="text-2xl font-bold text-purple-600">{data.totalThemes}</div>
      <div className="text-xs text-muted-foreground">Themes</div>
    </div>
  </div>
);

const TopCountriesWidget: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-2">
    {data.map((item, index) => (
      <div key={item.countryId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
            index === 0 && "bg-yellow-500 text-white",
            index === 1 && "bg-gray-400 text-white",
            index === 2 && "bg-amber-700 text-white",
            index > 2 && "bg-muted-foreground/20"
          )}>
            {item.rank}
          </div>
          <span className="text-lg">{item.flag}</span>
          <span className="font-medium text-sm">{item.countryName}</span>
        </div>
        <Badge variant="secondary" className="font-bold">{item.score.toFixed(1)}</Badge>
      </div>
    ))}
  </div>
);

const BottomCountriesWidget: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-2">
    {data.map((item) => (
      <div key={item.countryId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-orange-100 text-orange-700">
            {item.rank}
          </div>
          <span className="text-lg">{item.flag}</span>
          <span className="font-medium text-sm">{item.countryName}</span>
        </div>
        <Badge variant="outline" className="font-bold text-orange-600">{item.score.toFixed(1)}</Badge>
      </div>
    ))}
  </div>
);

const RegionalComparisonWidget: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-3">
    {data.map((region) => (
      <div key={region.region} className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">{region.region}</span>
          <span className="text-muted-foreground">{region.avgScore}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all"
            style={{ width: `${region.avgScore}%` }}
          />
        </div>
      </div>
    ))}
  </div>
);

const RankingsWidget: React.FC<{ data: any[] }> = ({ data }) => (
  <ScrollArea className="h-[300px]">
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.countryId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
              item.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {item.rank}
            </div>
            <div>
              <div className="font-medium text-sm">{item.countryName}</div>
              <div className="text-xs text-muted-foreground">
                EDU: {item.educationScore} | HLT: {item.healthScore} | EMP: {item.employmentScore}
              </div>
            </div>
          </div>
          <Badge className="font-bold">{item.score.toFixed(1)}</Badge>
        </div>
      ))}
    </div>
  </ScrollArea>
);

const CountrySpotlightWidget: React.FC<{ data: any }> = ({ data }) => {
  if (!data.country) return <div className="text-muted-foreground">Country not found</div>;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{data.country.flag}</span>
        <div>
          <h3 className="font-bold text-lg">{data.country.name}</h3>
          <p className="text-sm text-muted-foreground">{data.country.region}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-primary/10 rounded-lg">
          <div className="text-2xl font-bold text-primary">#{data.rank}</div>
          <div className="text-xs text-muted-foreground">of {data.totalCountries}</div>
        </div>
        <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.overallScore.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Youth Index</div>
        </div>
      </div>
      
      <div className="space-y-2">
        {[
          { label: 'Education', score: data.educationScore, color: 'bg-blue-500' },
          { label: 'Health', score: data.healthScore, color: 'bg-green-500' },
          { label: 'Employment', score: data.employmentScore, color: 'bg-yellow-500' },
          { label: 'Civic', score: data.civicScore, color: 'bg-purple-500' },
          { label: 'Innovation', score: data.innovationScore, color: 'bg-pink-500' },
        ].map(dim => (
          <div key={dim.label} className="flex items-center gap-2">
            <span className="text-xs w-20">{dim.label}</span>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div className={cn("h-2 rounded-full", dim.color)} style={{ width: `${dim.score}%` }} />
            </div>
            <span className="text-xs w-10 text-right">{dim.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrendAnalysisWidget: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-4">
    <div className="flex items-end justify-between gap-2 h-[150px]">
      {data.map((item, index) => (
        <div key={item.year} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full bg-primary rounded-t transition-all"
            style={{ height: `${item.averageScore * 1.5}px` }}
          />
          <span className="text-xs text-muted-foreground">{item.year}</span>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-center gap-2 text-sm">
      <TrendingUp className="h-4 w-4 text-green-500" />
      <span className="text-muted-foreground">
        {data.length > 1 && (
          <>
            {((data[data.length - 1].averageScore - data[0].averageScore)).toFixed(1)} point change
          </>
        )}
      </span>
    </div>
  </div>
);

const ThemeBreakdownWidget: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-2">
    {data.map((theme) => (
      <div key={theme.themeId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: theme.color }}
          />
          <span className="text-sm font-medium">{theme.themeName}</span>
        </div>
        <Badge variant="outline">{theme.indicatorCount} indicators</Badge>
      </div>
    ))}
  </div>
);

const RecentInsightsWidget: React.FC<{ limit: number }> = ({ limit }) => {
  const insights = useMemo(() => getHighPriorityInsights(2024).slice(0, limit), [limit]);
  
  return (
    <ScrollArea className="h-[250px]">
      <div className="space-y-3 pr-4">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} variant="compact" />
        ))}
      </div>
    </ScrollArea>
  );
};

const DataTableWidget: React.FC<{ data: any[] }> = ({ data }) => (
  <ScrollArea className="h-[350px]">
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-background">
        <tr className="border-b">
          <th className="text-left p-2">#</th>
          <th className="text-left p-2">Country</th>
          <th className="text-left p-2">Region</th>
          <th className="text-right p-2">Score</th>
          <th className="text-right p-2">EDU</th>
          <th className="text-right p-2">HLT</th>
          <th className="text-right p-2">EMP</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.countryId} className="border-b hover:bg-muted/50">
            <td className="p-2 font-medium">{row.rank}</td>
            <td className="p-2">{row.countryName}</td>
            <td className="p-2 text-muted-foreground text-xs">{row.region}</td>
            <td className="p-2 text-right font-bold">{row.overallScore.toFixed(1)}</td>
            <td className="p-2 text-right text-muted-foreground">{row.educationScore}</td>
            <td className="p-2 text-right text-muted-foreground">{row.healthScore}</td>
            <td className="p-2 text-right text-muted-foreground">{row.employmentScore}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </ScrollArea>
);

// Main widget content component
const WidgetContent: React.FC<WidgetContentProps> = ({ widget, data, isEditing }) => {
  if (isEditing) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px] text-muted-foreground">
        <GripVertical className="h-8 w-8 opacity-30" />
      </div>
    );
  }
  
  switch (widget.type) {
    case 'quick-stats':
      return <QuickStatsWidget data={data.data} />;
    case 'top-countries':
      return <TopCountriesWidget data={data.data} />;
    case 'bottom-countries':
      return <BottomCountriesWidget data={data.data} />;
    case 'regional-comparison':
      return <RegionalComparisonWidget data={data.data} />;
    case 'youth-index-ranking':
      return <RankingsWidget data={data.data} />;
    case 'country-spotlight':
      return <CountrySpotlightWidget data={data.data} />;
    case 'trend-analysis':
      return <TrendAnalysisWidget data={data.data} />;
    case 'theme-breakdown':
      return <ThemeBreakdownWidget data={data.data} />;
    case 'recent-insights':
      return <RecentInsightsWidget limit={widget.config.limit || 5} />;
    case 'data-table':
      return <DataTableWidget data={data.data} />;
    case 'map-overview':
      return (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground bg-muted/50 rounded-lg">
          <Globe className="h-12 w-12 opacity-30" />
          <span className="ml-2">Map visualization</span>
        </div>
      );
    default:
      return <div className="text-muted-foreground">Widget type not supported</div>;
  }
};

// ============================================
// WIDGET CARD COMPONENT
// ============================================

interface DashboardWidgetCardProps {
  widget: DashboardWidget;
  dashboardId: string;
  isEditing: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<Pick<DashboardWidget, 'title' | 'size' | 'config'>>) => void;
}

const DashboardWidgetCard: React.FC<DashboardWidgetCardProps> = ({
  widget,
  dashboardId,
  isEditing,
  onRemove,
  onUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const data = useMemo(() => getWidgetData(widget), [widget]);
  
  return (
    <Card className={cn(
      SIZE_CLASSES[widget.size],
      isEditing && "border-dashed border-2 cursor-move",
      isExpanded && "col-span-full"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {WIDGET_ICONS[widget.type]}
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdate({ size: 'small' })}>
                  Small
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdate({ size: 'medium' })}>
                  Medium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdate({ size: 'large' })}>
                  Large
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdate({ size: 'full' })}>
                  Full Width
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onRemove}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <WidgetContent widget={widget} data={data} isEditing={isEditing} />
      </CardContent>
    </Card>
  );
};

// ============================================
// ADD WIDGET DIALOG
// ============================================

interface AddWidgetDialogProps {
  dashboardId: string;
  onAdd: (widgetType: WidgetType, title?: string) => void;
}

const AddWidgetDialog: React.FC<AddWidgetDialogProps> = ({ dashboardId, onAdd }) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('all');
  
  const filteredTemplates = useMemo(() => {
    if (category === 'all') return WIDGET_TEMPLATES;
    return WIDGET_TEMPLATES.filter(t => t.category === category);
  }, [category]);
  
  const handleAdd = () => {
    if (selectedType) {
      onAdd(selectedType, title || undefined);
      setOpen(false);
      setSelectedType(null);
      setTitle('');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your dashboard
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            {['all', 'overview', 'rankings', 'analysis', 'data'].map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
          
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.type}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all hover:border-primary",
                    selectedType === template.type && "border-primary bg-primary/5"
                  )}
                  onClick={() => {
                    setSelectedType(template.type);
                    setTitle(template.name);
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {WIDGET_ICONS[template.type]}
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs capitalize">
                    {template.defaultSize}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
          
          {selectedType && (
            <div className="space-y-2">
              <Label htmlFor="widget-title">Widget Title</Label>
              <Input
                id="widget-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter custom title..."
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selectedType}>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// DASHBOARD SELECTOR
// ============================================

interface DashboardSelectorProps {
  activeDashboard: DashboardConfig;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
}

const DashboardSelector: React.FC<DashboardSelectorProps> = ({
  activeDashboard,
  onSelect,
  onCreate,
}) => {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const dashboards = useMemo(() => getAllDashboards(), []);
  
  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setCreating(false);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Select value={activeDashboard.id} onValueChange={onSelect}>
        <SelectTrigger className="w-[250px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dashboards.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              <div className="flex items-center gap-2">
                {d.isDefault && <Badge variant="outline" className="text-[10px] py-0">Default</Badge>}
                <span>{d.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {creating ? (
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Dashboard name..."
            className="w-[200px]"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button size="icon" onClick={handleCreate} disabled={!newName.trim()}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setCreating(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      )}
    </div>
  );
};

// ============================================
// MAIN DASHBOARD BUILDER COMPONENT
// ============================================

const DashboardBuilder: React.FC = () => {
  const [activeDashboard, setActiveDashboardState] = useState<DashboardConfig>(() => getActiveDashboard());
  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    const updated = getDashboard(activeDashboard.id);
    if (updated) setActiveDashboardState(updated);
  }, [activeDashboard.id]);
  
  const handleSelectDashboard = useCallback((id: string) => {
    setActiveDashboard(id);
    const dashboard = getDashboard(id);
    if (dashboard) setActiveDashboardState(dashboard);
  }, []);
  
  const handleCreateDashboard = useCallback((name: string) => {
    const newDashboard = createDashboard(name);
    handleSelectDashboard(newDashboard.id);
  }, [handleSelectDashboard]);
  
  const handleAddWidget = useCallback((widgetType: WidgetType, title?: string) => {
    addWidget(activeDashboard.id, widgetType, title);
    refresh();
  }, [activeDashboard.id, refresh]);
  
  const handleRemoveWidget = useCallback((widgetId: string) => {
    removeWidget(activeDashboard.id, widgetId);
    refresh();
  }, [activeDashboard.id, refresh]);
  
  const handleUpdateWidget = useCallback((widgetId: string, updates: Partial<Pick<DashboardWidget, 'title' | 'size' | 'config'>>) => {
    updateWidget(activeDashboard.id, widgetId, updates);
    refresh();
  }, [activeDashboard.id, refresh]);
  
  const handleDeleteDashboard = useCallback(() => {
    if (deleteDashboard(activeDashboard.id)) {
      const newActive = getActiveDashboard();
      setActiveDashboardState(newActive);
    }
  }, [activeDashboard.id]);
  
  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Dashboard Builder</h1>
            <p className="text-sm text-muted-foreground">
              Customize your view of African youth data
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DashboardSelector
            activeDashboard={activeDashboard}
            onSelect={handleSelectDashboard}
            onCreate={handleCreateDashboard}
          />
        </div>
      </div>
      
      <Separator />
      
      {/* Dashboard Info & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{activeDashboard.name}</h2>
          {activeDashboard.description && (
            <p className="text-sm text-muted-foreground">{activeDashboard.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {activeDashboard.widgets.length} widgets • 
            {activeDashboard.isDefault ? ' Default dashboard' : ' Custom dashboard'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <AddWidgetDialog dashboardId={activeDashboard.id} onAdd={handleAddWidget} />
          
          <Button
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Done
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Edit Layout
              </>
            )}
          </Button>
          
          {!activeDashboard.isDefault && (
            <Button variant="destructive" size="icon" onClick={handleDeleteDashboard}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Widgets Grid */}
      {activeDashboard.widgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeDashboard.widgets.map((widget) => (
            <DashboardWidgetCard
              key={widget.id}
              widget={widget}
              dashboardId={activeDashboard.id}
              isEditing={isEditing}
              onRemove={() => handleRemoveWidget(widget.id)}
              onUpdate={(updates) => handleUpdateWidget(widget.id, updates)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Add widgets to your dashboard to visualize African youth data
            </p>
            <AddWidgetDialog dashboardId={activeDashboard.id} onAdd={handleAddWidget} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardBuilder;
