import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Calendar, Tag, Search, Filter, Star, Code, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type ReportType = 'Country Report' | 'Thematic Report' | 'Regional Report';

const reportTypeBadgeColor: Record<ReportType, string> = {
  'Country Report': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Thematic Report': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Regional Report': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

const reports = [
  {
    id: 1,
    title: "African Youth Index 2024",
    description: "Comprehensive ranking of African countries based on youth development indicators across education, employment, health, and civic engagement.",
    category: "Annual Report",
    type: "Thematic Report" as ReportType,
    theme: "General",
    year: 2024,
    date: "2024-11-15",
    featured: true,
    downloads: 2847,
    format: ["PDF", "XLSX"]
  },
  {
    id: 2,
    title: "Youth Employment Outlook: Sub-Saharan Africa",
    description: "Analysis of youth labor market trends, unemployment patterns, and emerging opportunities across Sub-Saharan African economies.",
    category: "Thematic Brief",
    type: "Regional Report" as ReportType,
    theme: "Employment",
    year: 2024,
    date: "2024-10-02",
    featured: true,
    downloads: 1523,
    format: ["PDF"]
  },
  {
    id: 3,
    title: "Education Access and Quality Report",
    description: "Examining educational attainment, enrollment rates, and learning outcomes for African youth aged 15-24.",
    category: "Thematic Brief",
    type: "Thematic Report" as ReportType,
    theme: "Education",
    year: 2024,
    date: "2024-09-18",
    featured: false,
    downloads: 1102,
    format: ["PDF", "DOCX"]
  },
  {
    id: 4,
    title: "Youth Health and Wellbeing Dashboard",
    description: "Interactive report on youth health indicators including access to healthcare, mental health, and nutrition status.",
    category: "Dashboard Report",
    type: "Country Report" as ReportType,
    theme: "Health",
    year: 2023,
    date: "2023-12-05",
    featured: false,
    downloads: 892,
    format: ["PDF"]
  },
  {
    id: 5,
    title: "Youth Entrepreneurship Ecosystem Analysis",
    description: "Mapping the startup landscape and entrepreneurial activity among young Africans across all 54 countries.",
    category: "Thematic Brief",
    type: "Thematic Report" as ReportType,
    theme: "Entrepreneurship",
    year: 2023,
    date: "2023-08-22",
    featured: true,
    downloads: 1341,
    format: ["PDF", "XLSX"]
  },
  {
    id: 6,
    title: "Regional Comparison: East vs West Africa",
    description: "Comparative analysis of youth development metrics between East and West African regions.",
    category: "Comparative Study",
    type: "Regional Report" as ReportType,
    theme: "General",
    year: 2023,
    date: "2023-07-10",
    featured: false,
    downloads: 654,
    format: ["PDF"]
  },
  {
    id: 7,
    title: "Gender Parity in Youth Development",
    description: "Examining gender gaps in education, employment, and economic opportunities for young men and women.",
    category: "Special Report",
    type: "Thematic Report" as ReportType,
    theme: "General",
    year: 2024,
    date: "2024-06-30",
    featured: false,
    downloads: 987,
    format: ["PDF", "XLSX"]
  },
  {
    id: 8,
    title: "Youth Population Projections 2030-2050",
    description: "Demographic forecasting and analysis of Africa's youth bulge and its implications for development.",
    category: "Technical Report",
    type: "Country Report" as ReportType,
    theme: "Population",
    year: 2024,
    date: "2024-03-14",
    featured: false,
    downloads: 1205,
    format: ["PDF"]
  }
];

const categories = ["All Categories", "Annual Report", "Thematic Brief", "Dashboard Report", "Comparative Study", "Special Report", "Technical Report"];
const themes = ["All Themes", "General", "Population", "Education", "Health", "Employment", "Entrepreneurship"];
const years = ["All Years", "2024", "2023", "2022", "2021"];

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedTheme, setSelectedTheme] = useState('All Themes');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleCopyEmbed = (report: typeof reports[0]) => {
    const embedCode = `<iframe src="https://ayd.africa/embed/report/${report.id}" width="600" height="400" frameborder="0" title="${report.title}"></iframe>`;
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopiedId(report.id);
      toast({
        title: 'Embed code copied!',
        description: `Embed code for "${report.title}" has been copied to your clipboard.`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || report.category === selectedCategory;
    const matchesTheme = selectedTheme === 'All Themes' || report.theme === selectedTheme;
    const matchesYear = selectedYear === 'All Years' || report.year.toString() === selectedYear;
    return matchesSearch && matchesCategory && matchesTheme && matchesYear;
  });

  const featuredReports = reports.filter(r => r.featured);

  return (
    <>
      <header className="gradient-hero py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <h1 className="section-title mb-2">Reports & Publications</h1>
          <p className="section-description">
            Access our latest reports, thematic briefs, and data publications on African youth development.
          </p>
        </div>
      </header>

      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          {/* Featured Reports */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-pan-gold-500" />
              Featured Publications
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredReports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">{report.category}</Badge>
                      <span className="text-xs text-muted-foreground">{report.year}</span>
                    </div>
                    <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-2">{report.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-3">{report.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{report.downloads.toLocaleString()} downloads</span>
                      <Button size="sm" className="gap-1">
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Filters */}
          <section className="mb-6">
            <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Filter Reports</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map(theme => (
                      <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* All Reports - Card Grid */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">All Publications ({filteredReports.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardContent className="p-4 md:p-5 flex flex-col flex-grow">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${reportTypeBadgeColor[report.type]}`}>
                        {report.type}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{report.category}</Badge>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>

                    <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2">{report.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-3 flex-grow">{report.description}</p>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>|</span>
                      <span>{report.downloads.toLocaleString()} downloads</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      {report.format.map(format => (
                        <Button key={format} variant="outline" size="sm" className="gap-1 text-xs flex-1 min-w-0">
                          <Download className="h-3 w-3 flex-shrink-0" />
                          {format}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => handleCopyEmbed(report)}
                      >
                        {copiedId === report.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Code className="h-3 w-3" />
                        )}
                        Embed
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Reports;
