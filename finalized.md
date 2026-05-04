# African Youth Database (AYD) - Complete Codebase Analysis

> **Generated**: March 16, 2026

> **Total Source Files**: 103 TypeScript/TSX files
> **Total Lines of Code**: 16,760

---

## Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [File-by-File Line Counts](#4-file-by-file-line-counts)
5. [Routes & Pages](#5-routes--pages)
6. [Component Architecture](#6-component-architecture)
7. [Services & API Layer](#7-services--api-layer)
8. [Data Model & Types](#8-data-model--types)
9. [State Management & Data Fetching](#9-state-management--data-fetching)
10. [Styling & Theming](#10-styling--theming)
11. [Authentication System](#11-authentication-system)
12. [Build & Configuration](#12-build--configuration)
13. [Git History & Branches](#13-git-history--branches)
14. [Bugs & Issues Found](#14-bugs--issues-found)
15. [Possible Solutions](#15-possible-solutions)
16. [Missing Features](#16-missing-features)
17. [Recommendations & Next Steps](#17-recommendations--next-steps)

---

## 1. What Is This Project?

The **African Youth Database (AYD)** is a full-stack web application designed as a comprehensive data intelligence platform for exploring, analyzing, and visualizing youth statistics across all **54 African countries**.

### Purpose
- Provide a centralized platform for African youth data across 9 thematic areas
- Enable comparison of countries, regions, and indicators
- Generate AI-powered insights from youth data
- Offer a Youth Index ranking system for all African nations
- Support data export in multiple formats (CSV, JSON, Excel)
- Serve researchers, policymakers, NGOs, and the public

### How It Works
- **Frontend-only React SPA** built with Vite, TypeScript, and Tailwind CSS
- Uses **mock data** generated with seeded random functions (no real backend yet)
- Simulates API calls with `setTimeout` delays (100-300ms)
- Client-side state management via **React Query** (TanStack)
- **shadcn/ui** component library for consistent, accessible UI
- Interactive maps, charts, and data visualizations via **Recharts** and **react-simple-maps**

### Core Features
| Feature | Description | Status |
|---------|-------------|--------|
| Data Explorer | Filter and visualize youth indicators by country, theme, year, gender | Functional (mock data) |
| Country Comparison | Side-by-side comparison of multiple countries | Functional (mock data) |
| Youth Index Rankings | Composite index ranking all 54 countries | Functional (mock data) |
| Interactive Africa Map | Choropleth map with country selection | Functional |
| Dashboard Builder | Drag-and-drop customizable dashboards | Functional (no persistence) |
| AI Insights | Auto-generated data insights and recommendations | Functional (simulated) |
| Data Export | Export to CSV, JSON, Excel formats | Functional |
| Authentication | Sign in / Sign up with Google OAuth | UI only, no backend |
| Dark/Light Mode | Theme toggle with system preference detection | Fully functional |
| Responsive Design | Mobile-first responsive layout | Fully functional |

---

## 2. Technology Stack

### Core Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI library |
| Vite | 5.4.1 | Build tool with HMR |
| TypeScript | 5.5.3 | Type safety |
| React Router DOM | 6.26.2 | Client-side routing |

### UI & Styling
| Technology | Version | Purpose |
|-----------|---------|---------|
| shadcn/ui | Latest | 52+ accessible UI components |
| Tailwind CSS | 3.4.11 | Utility-first CSS framework |
| Tailwind Animate | 1.0.7 | Animation utilities |
| Radix UI | Various | 30+ accessible primitives |
| Lucide React | 0.462.0 | 600+ SVG icons |

### Data & State
| Technology | Version | Purpose |
|-----------|---------|---------|
| TanStack React Query | 5.56.2 | Server state & caching |
| React Hook Form | 7.53.0 | Form state management |
| Zod | 3.23.8 | Schema validation |

### Visualization
| Technology | Version | Purpose |
|-----------|---------|---------|
| Recharts | 2.12.7 | Charts (bar, line, area, pie) |
| react-simple-maps | 3.0.0 | SVG Africa map |
| Embla Carousel | 8.3.0 | Carousel/slider |

### Utilities
| Technology | Version | Purpose |
|-----------|---------|---------|
| next-themes | 0.4.6 | Dark/light mode |
| sonner | 1.5.0 | Toast notifications |
| date-fns | 3.6.0 | Date utilities |
| clsx + tailwind-merge | Latest | Class name utilities |
| class-variance-authority | 0.7.1 | Type-safe CSS variants |

### Dev Tools
| Technology | Version | Purpose |
|-----------|---------|---------|
| ESLint | 9.9.0 | Code linting |
| TypeScript ESLint | 8.0.1 | TS-specific linting |
| PostCSS | 8.4.47 | CSS processing |
| Autoprefixer | 10.4.20 | Vendor prefixes |

---

## 3. Project Structure

```
African-Youth-Database/
├── src/
│   ├── components/                    # Reusable UI components
│   │   ├── ui/                        # 52 shadcn/ui base components
│   │   ├── home/                      # Landing page sections
│   │   │   ├── Hero.tsx               # Hero section
│   │   │   ├── QuickStats.tsx         # Statistics cards
│   │   │   ├── FeaturedData.tsx       # Featured data showcase
│   │   │   └── Partners.tsx           # Partner logos
│   │   ├── explore/                   # Data exploration
│   │   │   ├── AfricaMap.tsx          # Interactive SVG map
│   │   │   ├── DataChart.tsx          # Chart visualization
│   │   │   └── DataFilters.tsx        # Filter sidebar
│   │   ├── compare/                   # Country comparison
│   │   │   └── CountryComparison.tsx  # Multi-country compare
│   │   ├── countries/                 # Country profiles
│   │   │   └── CountryProfile.tsx     # Country detail view
│   │   ├── dashboard/                 # Dashboard builder
│   │   │   ├── DashboardBuilder.tsx   # Drag-and-drop builder
│   │   │   └── index.tsx             # Barrel export
│   │   ├── insights/                  # AI insights
│   │   │   ├── InsightsDashboard.tsx  # Insights display
│   │   │   └── index.tsx             # Barrel export
│   │   ├── charts/                    # Chart components
│   │   │   └── index.tsx             # Bar & ranking charts
│   │   ├── export/                    # Export functionality
│   │   │   ├── ExportDialog.tsx       # Export modal
│   │   │   └── index.tsx             # Barrel export
│   │   ├── Navbar.tsx                 # Main navigation
│   │   ├── Footer.tsx                 # Site footer
│   │   ├── ThemeProvider.tsx          # Theme context
│   │   └── ThemeToggle.tsx            # Dark mode toggle
│   ├── pages/                         # Page components
│   │   ├── Index.tsx                  # Home page
│   │   ├── Landing.tsx                # Animated landing
│   │   ├── Explore.tsx                # Data explorer
│   │   ├── Compare.tsx                # Comparison page
│   │   ├── YouthIndex.tsx             # Youth index rankings
│   │   ├── Dashboard.tsx              # Dashboard builder page
│   │   ├── Insights.tsx               # AI insights page
│   │   ├── Countries.tsx              # Countries list
│   │   ├── Themes.tsx                 # Theme explorer
│   │   ├── Reports.tsx                # Reports page
│   │   ├── About.tsx                  # About page
│   │   ├── Contact.tsx                # Contact form
│   │   ├── NotFound.tsx               # 404 page
│   │   ├── resources/
│   │   │   ├── FAQ.tsx                # FAQs
│   │   │   ├── Glossary.tsx           # Terms & definitions
│   │   │   └── Methodology.tsx        # Data methodology
│   │   └── auth/
│   │       ├── SignIn.tsx             # Login form
│   │       └── SignUp.tsx             # Registration form
│   ├── services/                      # Business logic
│   │   ├── api.ts                     # Mock API client
│   │   ├── insights.ts                # AI insights engine
│   │   ├── export.ts                  # Export (CSV/JSON/Excel)
│   │   ├── dashboard.ts               # Dashboard utilities
│   │   └── index.ts                   # Barrel export
│   ├── hooks/                         # Custom React hooks
│   │   ├── useData.ts                 # 40+ data fetching hooks
│   │   ├── use-mobile.tsx             # Mobile detection
│   │   └── use-toast.ts              # Toast notifications
│   ├── types/                         # TypeScript definitions
│   │   ├── database.types.ts          # All type definitions
│   │   ├── constants.ts               # Country & indicator data
│   │   ├── mockData.ts                # Mock data generation
│   │   └── index.ts                   # Barrel export
│   ├── lib/
│   │   └── utils.ts                   # Helper functions (cn)
│   ├── App.tsx                        # Main app + router
│   ├── main.tsx                       # Entry point
│   └── vite-env.d.ts                  # Vite type declarations
├── public/                            # Static assets
├── dist/                              # Build output
├── index.html                         # HTML template
├── package.json                       # Dependencies
├── tailwind.config.ts                 # Tailwind config
├── vite.config.ts                     # Vite config
├── tsconfig.json                      # TypeScript config
├── postcss.config.js                  # PostCSS config
├── components.json                    # shadcn/ui config
└── *.md                               # Documentation files
```

---

## 4. File-by-File Line Counts

### Top 30 Files (Largest First)

| # | File | Lines | Category |
|---|------|-------|----------|
| 1 | `src/components/dashboard/DashboardBuilder.tsx` | 820 | Component |
| 2 | `src/components/ui/sidebar.tsx` | 761 | UI Component |
| 3 | `src/components/charts/index.tsx` | 722 | Component |
| 4 | `src/types/mockData.ts` | 696 | Data |
| 5 | `src/services/dashboard.ts` | 685 | Service |
| 6 | `src/components/countries/CountryProfile.tsx` | 581 | Component |
| 7 | `src/components/compare/CountryComparison.tsx` | 547 | Component |
| 8 | `src/services/insights.ts` | 545 | Service |
| 9 | `src/services/export.ts` | 543 | Service |
| 10 | `src/types/database.types.ts` | 514 | Types |
| 11 | `src/components/insights/InsightsDashboard.tsx` | 456 | Component |
| 12 | `src/pages/YouthIndex.tsx` | 413 | Page |
| 13 | `src/services/api.ts` | 405 | Service |
| 14 | `src/components/ui/chart.tsx` | 363 | UI Component |
| 15 | `src/hooks/useData.ts` | 326 | Hook |
| 16 | `src/components/explore/AfricaMap.tsx` | 310 | Component |
| 17 | `src/components/explore/DataChart.tsx` | 296 | Component |
| 18 | `src/pages/auth/SignUp.tsx` | 273 | Page |
| 19 | `src/pages/Reports.tsx` | 271 | Page |
| 20 | `src/components/ui/carousel.tsx` | 260 | UI Component |
| 21 | `src/pages/Contact.tsx` | 259 | Page |
| 22 | `src/types/constants.ts` | 255 | Data |
| 23 | `src/components/ui/menubar.tsx` | 234 | UI Component |
| 24 | `src/pages/Landing.tsx` | 230 | Page |
| 25 | `src/pages/resources/Methodology.tsx` | 212 | Page |
| 26 | `src/components/export/ExportDialog.tsx` | 205 | Component |
| 27 | `src/components/ui/dropdown-menu.tsx` | 198 | UI Component |
| 28 | `src/components/ui/context-menu.tsx` | 198 | UI Component |
| 29 | `src/pages/Themes.tsx` | 197 | Page |
| 30 | `src/pages/resources/Glossary.tsx` | 195 | Page |

### Remaining Files

| # | File | Lines | Category |
|---|------|-------|----------|
| 31 | `src/hooks/use-toast.ts` | 191 | Hook |
| 32 | `src/pages/auth/SignIn.tsx` | 188 | Page |
| 33 | `src/components/ui/form.tsx` | 176 | UI Component |
| 34 | `src/components/explore/DataFilters.tsx` | 171 | Component |
| 35 | `src/pages/About.tsx` | 165 | Page |
| 36 | `src/components/Navbar.tsx` | 164 | Component |
| 37 | `src/pages/resources/FAQ.tsx` | 161 | Page |
| 38 | `src/components/ui/select.tsx` | 158 | UI Component |
| 39 | `src/components/ui/command.tsx` | 153 | UI Component |
| 40 | `src/components/ui/alert-dialog.tsx` | 139 | UI Component |
| 41 | `src/components/ui/sheet.tsx` | 131 | UI Component |
| 42 | `src/components/ui/navigation-menu.tsx` | 128 | UI Component |
| 43 | `src/components/ui/toast.tsx` | 127 | UI Component |
| 44 | `src/components/ui/dialog.tsx` | 120 | UI Component |
| 45 | `src/components/ui/table.tsx` | 117 | UI Component |
| 46 | `src/components/ui/pagination.tsx` | 117 | UI Component |
| 47 | `src/pages/Countries.tsx` | 116 | Page |
| 48 | `src/components/ui/drawer.tsx` | 116 | UI Component |
| 49 | `src/components/ui/breadcrumb.tsx` | 115 | UI Component |
| 50 | `src/components/home/QuickStats.tsx` | 112 | Component |
| 51 | `src/pages/Explore.tsx` | 111 | Page |
| 52 | `src/components/home/FeaturedData.tsx` | 106 | Component |
| 53 | `src/components/Footer.tsx` | 102 | Component |
| 54 | `src/components/home/Hero.tsx` | 89 | Component |
| 55 | `src/components/ui/card.tsx` | 79 | UI Component |
| 56 | `src/components/ui/input-otp.tsx` | 69 | UI Component |
| 57 | `src/components/ui/calendar.tsx` | 64 | UI Component |
| 58 | `src/App.tsx` | 62 | Core |
| 59 | `src/components/ui/toggle-group.tsx` | 59 | UI Component |
| 60 | `src/components/ui/alert.tsx` | 59 | UI Component |
| 61 | `src/components/ui/button.tsx` | 56 | UI Component |
| 62 | `src/components/ui/accordion.tsx` | 56 | UI Component |
| 63 | `src/components/home/Partners.tsx` | 56 | Component |
| 64 | `src/components/ui/tabs.tsx` | 53 | UI Component |
| 65 | `src/components/ui/avatar.tsx` | 48 | UI Component |
| 66 | `src/components/ui/scroll-area.tsx` | 46 | UI Component |
| 67 | `src/components/ui/toggle.tsx` | 43 | UI Component |
| 68 | `src/components/ui/resizable.tsx` | 43 | UI Component |
| 69 | `src/components/ui/radio-group.tsx` | 42 | UI Component |
| 70 | `src/pages/Insights.tsx` | 41 | Page |
| 71 | `src/pages/Index.tsx` | 36 | Page |
| 72 | `src/components/ui/badge.tsx` | 36 | UI Component |
| 73 | `src/components/ThemeToggle.tsx` | 36 | Component |
| 74 | `src/pages/Compare.tsx` | 35 | Page |
| 75 | `src/components/ui/toaster.tsx` | 33 | UI Component |
| 76 | `src/components/ui/sonner.tsx` | 29 | UI Component |
| 77 | `src/components/ui/separator.tsx` | 29 | UI Component |
| 78 | `src/components/ui/popover.tsx` | 29 | UI Component |
| 79 | `src/components/ui/tooltip.tsx` | 28 | UI Component |
| 80 | `src/components/ui/checkbox.tsx` | 28 | UI Component |
| 81 | `src/pages/NotFound.tsx` | 27 | Page |
| 82 | `src/components/ui/switch.tsx` | 27 | UI Component |
| 83 | `src/components/ui/hover-card.tsx` | 27 | UI Component |
| 84 | `src/components/ui/slider.tsx` | 26 | UI Component |
| 85 | `src/components/ui/progress.tsx` | 26 | UI Component |
| 86 | `src/components/ui/textarea.tsx` | 24 | UI Component |
| 87 | `src/components/ui/label.tsx` | 24 | UI Component |
| 88 | `src/components/ui/input.tsx` | 22 | UI Component |
| 89 | `src/hooks/use-mobile.tsx` | 19 | Hook |
| 90 | `src/pages/Dashboard.tsx` | 17 | Page |
| 91 | `src/components/ui/skeleton.tsx` | 15 | UI Component |
| 92 | `src/services/index.ts` | 14 | Service |
| 93 | `src/types/index.ts` | 12 | Types |
| 94 | `src/components/ui/collapsible.tsx` | 9 | UI Component |
| 95 | `src/main.tsx` | 6 | Core |
| 96 | `src/lib/utils.ts` | 6 | Utility |
| 97 | `src/components/ThemeProvider.tsx` | 6 | Component |
| 98 | `src/components/ui/aspect-ratio.tsx` | 5 | UI Component |
| 99 | `src/components/ui/use-toast.ts` | 3 | UI Hook |
| 100 | `src/components/insights/index.tsx` | 2 | Barrel Export |
| 101 | `src/components/export/index.tsx` | 2 | Barrel Export |
| 102 | `src/components/dashboard/index.tsx` | 2 | Barrel Export |
| 103 | `src/vite-env.d.ts` | 1 | Type Declaration |

### Line Count Summary by Category

| Category | Files | Lines | % of Total |
|----------|-------|-------|------------|
| UI Components (shadcn/ui) | 52 | ~4,760 | 28.4% |
| Custom Components | 15 | ~3,830 | 22.9% |
| Pages | 18 | ~2,750 | 16.4% |
| Services | 5 | ~2,192 | 13.1% |
| Types & Data | 4 | ~1,477 | 8.8% |
| Hooks | 3 | ~536 | 3.2% |
| Core (App, main, etc.) | 6 | ~1,215 | 7.2% |
| **TOTAL** | **103** | **16,760** | **100%** |

---

## 5. Routes & Pages

Defined in `src/App.tsx` using React Router v6:

| Route | Component | Lines | Description |
|-------|-----------|-------|-------------|
| `/landing` | `Landing.tsx` | 230 | Animated landing page with gradient CTA |
| `/` | `Index.tsx` | 36 | Home page composing Hero, QuickStats, FeaturedData |
| `/explore` | `Explore.tsx` | 111 | Interactive data explorer with map and charts |
| `/compare` | `Compare.tsx` | 35 | Multi-country comparison tool |
| `/youth-index` | `YouthIndex.tsx` | 413 | Country rankings by composite youth index |
| `/dashboard` | `Dashboard.tsx` | 17 | Customizable dashboard builder |
| `/insights` | `Insights.tsx` | 41 | AI-powered insights display |
| `/countries` | `Countries.tsx` | 116 | All 54 countries with search & filter |
| `/themes` | `Themes.tsx` | 197 | 9 thematic areas explorer |
| `/reports` | `Reports.tsx` | 271 | Reports & publications page |
| `/about` | `About.tsx` | 165 | Platform mission, vision, team |
| `/contact` | `Contact.tsx` | 259 | Contact form with validation |
| `/resources/glossary` | `Glossary.tsx` | 195 | Terms & definitions |
| `/resources/methodology` | `Methodology.tsx` | 212 | Data collection methodology |
| `/resources/faq` | `FAQ.tsx` | 161 | Frequently asked questions |
| `/auth/signin` | `SignIn.tsx` | 188 | Login form (email + Google OAuth) |
| `/auth/signup` | `SignUp.tsx` | 273 | Registration form with password rules |
| `*` | `NotFound.tsx` | 27 | 404 error page |

---

## 6. Component Architecture

### Navigation & Layout
- **Navbar.tsx** (164 lines) - Sticky header with desktop menu, mobile drawer, search, theme toggle, sign-in button
- **Footer.tsx** (102 lines) - Site footer with navigation links and social media
- **ThemeProvider.tsx** (6 lines) - next-themes wrapper for dark/light mode
- **ThemeToggle.tsx** (36 lines) - Sun/Moon icon toggle button

### Home Page Components
- **Hero.tsx** (89 lines) - Main hero banner with CTA buttons
- **QuickStats.tsx** (112 lines) - Animated stat cards (countries, indicators, data points)
- **FeaturedData.tsx** (106 lines) - Highlighted data visualizations
- **Partners.tsx** (56 lines) - Partner organization logos

### Data Exploration Components
- **AfricaMap.tsx** (310 lines) - Interactive SVG choropleth map of Africa using react-simple-maps with country selection, color-coded data values, and tooltips
- **DataChart.tsx** (296 lines) - Multi-type chart component (bar, line, area, pie) using Recharts
- **DataFilters.tsx** (171 lines) - Sidebar with country, theme, indicator, year, and gender filters

### Comparison Components
- **CountryComparison.tsx** (547 lines) - Side-by-side country comparison with multiple indicators, charts, and detailed metrics

### Country Components
- **CountryProfile.tsx** (581 lines) - Full country detail view with demographics, indicator scores, historical trends, and regional context

### Dashboard Components
- **DashboardBuilder.tsx** (820 lines) - Drag-and-drop dashboard builder with widget configuration, layout management, 9 chart types, and save/load functionality

### Insights Components
- **InsightsDashboard.tsx** (456 lines) - Displays AI-generated insights with trend analysis, anomaly detection, comparisons, and recommendations

### Chart Components
- **charts/index.tsx** (722 lines) - Custom bar chart and ranking chart components built on Recharts

### Export Components
- **ExportDialog.tsx** (205 lines) - Modal dialog for exporting data in CSV, JSON, or Excel format with column selection

---

## 7. Services & API Layer

### API Service (`src/services/api.ts` - 405 lines)

All data is **mock/simulated** - no real backend exists. API calls use `setTimeout` to simulate network latency.

#### Country APIs
```typescript
countryApi.getAll()              // Returns all 54 countries
countryApi.getById(id)           // Single country lookup
countryApi.getByIsoCode(code)    // Lookup by ISO 2/3 code
countryApi.getByRegion(region)   // Filter by African region
countryApi.search(query)         // Text search
countryApi.getStats(id, year)    // Country statistics
countryApi.getRegions()          // All 5 regions
```

#### Theme APIs
```typescript
themeApi.getAll()                // All 9 themes
themeApi.getById(id)             // Single theme
themeApi.getStats(id, year)      // Theme statistics
```

#### Indicator APIs
```typescript
indicatorApi.getAll()            // All 50+ indicators
indicatorApi.getById(id)         // Single indicator
indicatorApi.getByTheme(id)      // Indicators for a theme
indicatorApi.search(query)       // Text search
```

#### Data APIs
```typescript
dataApi.getIndicatorValues(filters)  // Filtered data values
dataApi.getTimeSeries(params)        // Historical trends
dataApi.getComparisonData(params)    // Multi-country comparison
dataApi.getMapData(indicator, year)  // Geographic map data
dataApi.getChartTimeSeries(params)   // Chart-formatted time series
dataApi.getBarChartData(params)      // Top/bottom country data
dataApi.getRegionalData(params)      // Regional averages
```

#### Youth Index APIs
```typescript
youthIndexApi.getRankings(year)      // All country rankings
youthIndexApi.getByCountry(id)       // Single country index
youthIndexApi.getHistory(id)         // Historical rankings
youthIndexApi.getTopPerformers(n)    // Top N countries
youthIndexApi.getMostImproved(n)     // Most improved rankings
```

#### Comparison & Platform APIs
```typescript
comparisonApi.compareCountries(params)  // Multi-country compare
platformApi.getStats()                  // Platform statistics
```

### Insights Service (`src/services/insights.ts` - 545 lines)
- Generates trend insights (improving/declining indicators)
- Comparison insights (country vs regional average)
- Achievement highlights (top performing areas)
- Concern alerts (underperforming areas)
- Opportunity identification
- AI-style recommendations

### Export Service (`src/services/export.ts` - 543 lines)
- **CSV Export**: UTF-8 with BOM for Excel compatibility, proper escaping
- **JSON Export**: Pretty-printed, structured output
- **Excel Export**: SpreadsheetML XML format (no external dependency)
- Supports column selection and custom filenames

### Dashboard Service (`src/services/dashboard.ts` - 685 lines)
- Dashboard CRUD operations
- Widget management (add, remove, reorder)
- Layout configuration
- Template dashboards
- Dashboard sharing settings

---

## 8. Data Model & Types

### Core Types (`src/types/database.types.ts` - 514 lines)

#### Geography
```typescript
Country {
  id, name, isoCode3, isoCode2, region,
  capital, population, youthPopulation,
  area, currency, languages, economicBlocks,
  coordinates { lat, lng }, flagEmoji
}

Region = 'North Africa' | 'West Africa' | 'Central Africa' | 'East Africa' | 'Southern Africa'
EconomicBlock = 'ECOWAS' | 'SADC' | 'EAC' | 'CEMAC' | 'AMU' | 'COMESA' | 'IGAD'
```

#### Users & Organizations
```typescript
User {
  id, email, name, role, organization,
  permissions, lastLogin, createdAt
}
UserRole = 'public' | 'registered' | 'researcher' | 'contributor' | 'admin'

Organization {
  id, name, type, country, website, verified
}
```

#### Themes & Indicators
```typescript
Theme {
  id, name, description, icon, color, indicatorCount
}
// 9 Themes: Education, Employment, Health, Civic Engagement,
// Innovation & Technology, Agriculture, Gender, Financial Inclusion, Environment

Indicator {
  id, name, description, theme, unit, source,
  methodology, frequency, coverage
}
IndicatorUnit = 'percentage' | 'number' | 'index' | 'ratio' | 'rate' | 'currency' | 'score' | 'years'
// 50+ indicators across all themes
```

#### Data Values
```typescript
IndicatorValue {
  id, indicatorId, countryId, year, value,
  gender, ageGroup, source, confidence, isEstimate
}
GenderType = 'male' | 'female' | 'total'
AgeGroup = '15-19' | '20-24' | '25-29' | '30-35' | '15-24' | '15-35' | 'all'
```

#### Youth Index
```typescript
YouthIndexScore {
  id, countryId, year, overallScore,
  dimensions: {
    education (weight: 0.25),
    employment (weight: 0.30),
    health (weight: 0.25),
    civicEngagement (weight: 0.20),
    innovation (weight: 0.20)
  },
  rank, previousRank, rankChange, percentile, tier
}
IndexTier = 'high' | 'medium-high' | 'medium' | 'medium-low' | 'low'
```

#### Dashboards
```typescript
Dashboard {
  id, userId, title, description, layout,
  widgets: DashboardWidget[], isPublic, isTemplate
}
DashboardWidget {
  id, type, title, config, position, size
}
ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'map' | 'scatter' | 'radar' | 'treemap'
```

#### Insights & Reports
```typescript
Insight {
  id, type, title, description, entity,
  severity, confidence, dataPoints, recommendations
}
InsightType = 'trend' | 'anomaly' | 'comparison' | 'prediction' | 'summary'

Report {
  id, title, type, themes, countries,
  yearRange, status, publishDate, downloadUrl
}
```

### Constants (`src/types/constants.ts` - 255 lines)

**54 African Countries** with full metadata:
- North Africa (6): Algeria, Egypt, Libya, Mauritania, Morocco, Tunisia
- West Africa (16): Benin, Burkina Faso, Cabo Verde, Cote d'Ivoire, Gambia, Ghana, Guinea, Guinea-Bissau, Liberia, Mali, Niger, Nigeria, Senegal, Sierra Leone, Togo
- Central Africa (8): Cameroon, Central African Republic, Chad, Congo, DR Congo, Equatorial Guinea, Gabon, Sao Tome and Principe
- East Africa (14): Burundi, Comoros, Djibouti, Eritrea, Ethiopia, Kenya, Madagascar, Malawi, Mozambique, Rwanda, Somalia, South Sudan, Tanzania, Uganda
- Southern Africa (10): Angola, Botswana, Eswatini, Lesotho, Mauritius, Namibia, Seychelles, South Africa, Zambia, Zimbabwe

### Mock Data (`src/types/mockData.ts` - 696 lines)
- Seeded pseudo-random number generator for deterministic data
- Country development factors (0-1 scale per country)
- Per-indicator configuration: base values, variance, trends
- Generates realistic indicator values with gender/age breakdowns
- Youth Index score generation with weighted dimensions

---

## 9. State Management & Data Fetching

### React Query Setup (`src/hooks/useData.ts` - 326 lines)

**40+ custom hooks** wrapping React Query for every API endpoint:

#### Query Key Strategy
```typescript
queryKeys = {
  countries: { all, detail(id), region(r), stats(id,yr) },
  themes: { all, detail(id), stats(id,yr) },
  indicators: { all, detail(id), byTheme(id) },
  data: { values(filters), timeSeries(p), comparison(p), map(p), chart(p), bar(p), regional(p) },
  youthIndex: { rankings(yr), country(id), history(id), top(n), improved(n) },
  comparison: { countries(p) },
  platform: { stats }
}
```

#### Cache Configuration
| Data Type | Stale Time | Rationale |
|-----------|------------|-----------|
| Countries, Themes, Indicators | 1 hour | Reference data, rarely changes |
| Platform Stats | 5 minutes | Relatively static |
| Data Values, Charts | Default (0) | Always refetch for freshness |

#### Notable Hooks
- `useMultipleCountryStats(ids, year)` - Batch query for multiple countries
- `useMultipleTimeSeries(configs)` - Parallel time series queries
- All hooks use `enabled` option for conditional/dependent queries

---

## 10. Styling & Theming

### Tailwind Configuration
- **Dark Mode**: Class-based toggle (`class` strategy)
- **Pan-African Color Palette**:
  - Green: 9 shades (50-900) - Primary color
  - Gold: 9 shades (50-900) - Accent color
  - AYD Blue: 9 shades (50-900)
  - AYD Red: 9 shades (50-900)
- **Border Radius**: Custom variable-based system
- **Sidebar**: Custom sidebar color tokens

### Custom Animations
```css
fade-in:      400ms ease-out (opacity 0→1, translateY 10px→0)
slide-up:     500ms ease-out (opacity 0→1, translateY 20px→0)
pulse-gentle:  2s infinite (scale 1→1.05→1)
count-up:     600ms ease-out (opacity 0→1, translateY 5px→0)
```

### Design System
- Consistent spacing using Tailwind utilities
- Responsive breakpoints (mobile-first)
- Card-based layout patterns
- Glass-morphism effects on landing page
- Gradient text effects
- Animated background blobs

---

## 11. Authentication System

### Sign In (`src/pages/auth/SignIn.tsx` - 188 lines)
- Email & password form fields
- Password visibility toggle
- "Remember me" checkbox
- Google OAuth button (UI only)
- Form validation with React Hook Form
- Toast notification on submit
- Redirects to `/` on success
- Link to Sign Up page

### Sign Up (`src/pages/auth/SignUp.tsx` - 273 lines)
- Full name, email, password fields
- Password strength requirements:
  - Minimum 8 characters
  - Contains at least one number
  - Contains at least one uppercase letter
- Visual password requirement checklist (green checks)
- Terms & conditions acceptance checkbox
- Google OAuth option
- Toast notification on submit
- Link to Sign In page

### Current Status: **UI Only**
- No actual authentication backend
- No JWT/session management
- No password hashing
- Submit handlers use `setTimeout` to simulate API calls
- Navigation uses `window.location.href` instead of React Router

---

## 12. Build & Configuration

### Vite Config (`vite.config.ts`)
```typescript
{
  plugins: [react() /* SWC compiler */],
  server: { port: 8080, host: '::' },
  resolve: {
    alias: { '@': './src' }
  }
}
```

### TypeScript Config (`tsconfig.json`)
- Target: ES2020
- Module: ESNext
- Strict null checks: **disabled**
- Allow JS imports: **enabled**
- Skip lib check: **enabled**
- Path alias: `@/*` → `./src/*`

### Scripts (package.json)
```json
{
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

---

## 13. Git History & Branches

### Branches
| Branch | Description |
|--------|-------------|
| `main` | Production branch |
| `divine_backend` | Current - backend features & documentation |
| `magnus-frontend` | Frontend feature branch |

### Recent Commits on `divine_backend`
| Hash | Message |
|------|---------|
| `f963221` | Add backend development features and documentation |
| `e9560af` | Add animated landing and auth UI |
| `4349a74` | Changes |
| `322d5a2` | Add light/dark mode toggle |
| `8d93a68` | Changes |
| `5fb80eb` | Migrate AYD branding and pages |
| `084053f` | Changes |
| `ffbbc24` | Make mobile UI dynamic |
| `2bb6d6b` | Changes |
| `8eb9cef` | Fix broken theme routes |

### Documentation Added
- Product Requirements Document (PRD)
- Software Requirements Specification (SRS)
- Database Schema & ER Model

---

## 14. Bugs & Issues Found

### CRITICAL

#### BUG-01: No Backend Implementation
- **Where**: Entire `src/services/` directory
- **Problem**: All API calls return mock data generated client-side with `setTimeout` delays. There is no real server, database, or API.
- **Impact**: The application cannot store, retrieve, or persist any real data. All data resets on page refresh.

#### BUG-02: Authentication is Non-Functional
- **Where**: `src/pages/auth/SignIn.tsx`, `src/pages/auth/SignUp.tsx`
- **Problem**: Sign in/up forms display and accept input but have no backend. Submit handlers only show a toast and redirect. No actual user creation, password verification, or session management occurs.
- **Impact**: Anyone can "sign in" with any credentials. No access control exists.

#### BUG-03: Navigation Uses `window.location.href` Instead of React Router
- **Where**: `src/pages/auth/SignIn.tsx`, `src/pages/auth/SignUp.tsx`
- **Problem**: After form submission, the code uses `window.location.href = '/'` instead of React Router's `navigate('/')`. This causes a full page reload, destroying all client state.
- **Impact**: Unnecessary full page reload, loss of React Query cache, poor user experience.

### HIGH

#### BUG-04: No Error Boundaries
- **Where**: `src/App.tsx` and throughout
- **Problem**: No React Error Boundaries are implemented. If any component throws an error, the entire application crashes with a white screen.
- **Impact**: Single component error crashes the whole app.

#### BUG-05: No Loading/Error States in Some Pages
- **Where**: Various page components
- **Problem**: Some pages don't handle loading or error states from React Query hooks properly. Missing loading spinners and error messages.
- **Impact**: Users see blank content while data loads or when errors occur.

#### BUG-06: Dashboard State Not Persisted
- **Where**: `src/components/dashboard/DashboardBuilder.tsx`
- **Problem**: Dashboard configurations are stored in component state only. No localStorage or backend persistence.
- **Impact**: All custom dashboards are lost on page refresh.

#### BUG-07: TypeScript Strict Mode Disabled
- **Where**: `tsconfig.json`
- **Problem**: `strictNullChecks` is disabled, allowing potential null/undefined runtime errors that TypeScript would normally catch.
- **Impact**: Potential runtime errors from null references that go undetected at compile time.

### MEDIUM

#### BUG-08: Large Component Files
- **Where**: `DashboardBuilder.tsx` (820 lines), `charts/index.tsx` (722 lines), `mockData.ts` (696 lines), `dashboard.ts` (685 lines)
- **Problem**: Several files are excessively large, making them hard to maintain, test, and review.
- **Impact**: Reduced developer productivity, harder to debug, higher risk of merge conflicts.

#### BUG-09: No Input Sanitization
- **Where**: `src/pages/Contact.tsx`, search inputs throughout
- **Problem**: User inputs are not sanitized before display. While React prevents basic XSS through JSX escaping, there's no input validation at the form level beyond basic required fields.
- **Impact**: Potential for unexpected behavior with special characters.

#### BUG-10: Map Component May Fail Without TopoJSON
- **Where**: `src/components/explore/AfricaMap.tsx`
- **Problem**: The Africa map depends on an external TopoJSON file for geographic data. If the CDN or source is unavailable, the map will fail silently or show errors.
- **Impact**: Map visualization breaks if external resource is unavailable.

#### BUG-11: Export Service Memory Issues with Large Datasets
- **Where**: `src/services/export.ts`
- **Problem**: The Excel export builds an entire SpreadsheetML XML string in memory. For very large datasets, this could cause browser memory issues.
- **Impact**: Potential browser crash or hang with large exports.

#### BUG-12: Mock Data Seeding Creates Unrealistic Distributions
- **Where**: `src/types/mockData.ts`
- **Problem**: The seeded random number generator produces data that, while consistent, may not reflect real-world distributions. Country development factors are hardcoded estimates.
- **Impact**: Users might draw incorrect conclusions from unrealistic data patterns.

### LOW

#### BUG-13: Missing Meta Tags & SEO
- **Where**: `index.html`
- **Problem**: Missing Open Graph tags, Twitter cards, structured data, and proper meta descriptions for SEO.
- **Impact**: Poor search engine indexing and social media sharing.

#### BUG-14: No Favicon or App Icons Configured
- **Where**: `index.html`, `public/`
- **Problem**: No custom favicon, Apple touch icon, or PWA manifest configured.
- **Impact**: Generic browser tab icon, poor PWA experience.

#### BUG-15: Inconsistent Commit Messages
- **Where**: Git history
- **Problem**: Several commits have vague messages like "Changes" with no description of what changed.
- **Impact**: Harder to trace changes, debug regressions, and understand project history.

---

## 15. Possible Solutions

### For BUG-01 (No Backend)
**Option A: Node.js + Express + PostgreSQL**
- Build a REST API with Express.js
- Use Prisma ORM for database management
- Deploy on Vercel/Railway/Render
- Timeline: 2-4 weeks

**Option B: Python + FastAPI + PostgreSQL**
- Build an async API with FastAPI
- Use SQLAlchemy ORM
- Auto-generated OpenAPI documentation
- Timeline: 2-4 weeks

**Option C: Supabase (Backend-as-a-Service)**
- Use Supabase for database, auth, and API
- Minimal backend code required
- Built-in row-level security
- Timeline: 1-2 weeks

### For BUG-02 (No Auth)
**Option A: Supabase Auth**
- Drop-in authentication with email, Google OAuth, and more
- Session management included
- Row-level security for data access
- Timeline: 2-3 days

**Option B: NextAuth.js / Auth.js**
- Flexible authentication library
- Multiple provider support
- Session management with JWT or database
- Timeline: 3-5 days

**Option C: Firebase Auth**
- Google-backed authentication service
- Email/password, Google, social logins
- Client SDK available
- Timeline: 2-3 days

### For BUG-03 (window.location.href)
```typescript
// Replace:
window.location.href = '/';
// With:
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/');
```
Timeline: 30 minutes

### For BUG-04 (No Error Boundaries)
```typescript
// Create ErrorBoundary component and wrap routes
<ErrorBoundary fallback={<ErrorPage />}>
  <Routes>...</Routes>
</ErrorBoundary>
```
Timeline: 1-2 hours

### For BUG-05 (Missing Loading States)
- Add Skeleton components from shadcn/ui during loading
- Add error alert components for error states
- Use React Query's `isLoading` and `isError` flags consistently
- Timeline: 2-4 hours

### For BUG-06 (Dashboard Not Persisted)
**Quick fix**: Use `localStorage` to persist dashboard configs
**Proper fix**: Save to backend database when available
- Timeline: 1-2 hours (localStorage), included with backend implementation

### For BUG-07 (TypeScript Strict Mode)
- Enable `strict: true` in `tsconfig.json`
- Fix all resulting type errors (estimated 50-200 errors)
- Timeline: 1-2 days

### For BUG-08 (Large Files)
- Split `DashboardBuilder.tsx` into: `WidgetConfig.tsx`, `WidgetGrid.tsx`, `DashboardToolbar.tsx`, `WidgetRenderer.tsx`
- Split `charts/index.tsx` into: `BarChart.tsx`, `RankingChart.tsx`, `ChartConfig.tsx`
- Split `mockData.ts` into: `generators.ts`, `countryFactors.ts`, `indicatorConfigs.ts`
- Timeline: 1-2 days

### For BUG-09 (No Input Sanitization)
- Use Zod schemas (already installed) for form validation
- Add input length limits
- Sanitize before display where needed
- Timeline: 2-4 hours

### For BUG-10 (Map External Dependency)
- Bundle the TopoJSON file locally in `/public`
- Add error handling and fallback UI for map component
- Timeline: 1-2 hours

### For BUG-11 (Export Memory)
- Implement streaming/chunked export for large datasets
- Add row limit warnings
- Use Web Workers for large exports
- Timeline: 4-8 hours

---

## 16. Missing Features

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| Backend API | Critical | 2-4 weeks | Real server with database |
| Authentication | Critical | 2-5 days | User registration, login, sessions |
| Database | Critical | 1-2 weeks | PostgreSQL with migrations |
| Unit Tests | High | 1-2 weeks | Jest/Vitest for components & services |
| E2E Tests | High | 1 week | Playwright/Cypress test suite |
| Error Boundaries | High | 2 hours | Graceful error handling |
| Code Splitting | High | 1-2 days | Route-based lazy loading |
| API Documentation | Medium | 2-3 days | OpenAPI/Swagger docs |
| User Profiles | Medium | 1 week | Account management, preferences |
| Saved Dashboards | Medium | 3-5 days | Persist user dashboards |
| Real-time Updates | Medium | 1 week | WebSocket for live data |
| Advanced Search | Medium | 3-5 days | Full-text search, faceted filters |
| Accessibility Audit | Medium | 1 week | WCAG 2.1 compliance |
| CI/CD Pipeline | Medium | 1-2 days | GitHub Actions for build/test/deploy |
| Analytics/Tracking | Low | 2-3 days | User behavior analytics |
| PWA Support | Low | 1-2 days | Offline capability, install prompt |
| i18n (French/Arabic) | Low | 1-2 weeks | Multi-language support |
| Rate Limiting | Low | 1 day | API rate limiting |

---

## 17. Recommendations & Next Steps

### Immediate (Week 1)
1. Fix `window.location.href` navigation bug (BUG-03) - 30 minutes
2. Add React Error Boundaries (BUG-04) - 2 hours
3. Add loading/error states to all pages (BUG-05) - 4 hours
4. Persist dashboards to localStorage (BUG-06) - 2 hours
5. Bundle TopoJSON locally (BUG-10) - 1 hour

### Short-term (Weeks 2-4)
1. Choose and implement backend (Supabase recommended for speed)
2. Implement real authentication (Supabase Auth)
3. Set up PostgreSQL database with schema from ER model docs
4. Migrate mock data generators to database seeders
5. Enable TypeScript strict mode and fix errors
6. Add route-based code splitting with `React.lazy()`

### Medium-term (Weeks 5-8)
1. Split large components into smaller, testable units
2. Add unit test suite (Vitest + React Testing Library)
3. Add E2E test suite (Playwright)
4. Set up CI/CD pipeline (GitHub Actions)
5. Implement user profiles and saved dashboards
6. Add API documentation (OpenAPI)

### Long-term (Months 3-6)
1. Add real AI insights (integrate Claude API or similar)
2. Implement real-time data updates (WebSocket)
3. Add internationalization (French, Arabic, Portuguese)
4. Conduct accessibility audit (WCAG 2.1)
5. Add PWA support for offline access
6. Performance optimization (bundle analysis, image optimization)
7. Security audit and penetration testing

---

## Final Summary

| Metric | Value |
|--------|-------|
| **Total Files** | 103 TypeScript/TSX |
| **Total Lines** | 16,760 |
| **Pages** | 18 routes |
| **Components** | 67 (15 custom + 52 shadcn/ui) |
| **Services** | 5 modules |
| **Custom Hooks** | 40+ |
| **Countries Covered** | 54 (all of Africa) |
| **Themes** | 9 |
| **Indicators** | 50+ |
| **Critical Bugs** | 3 |
| **High-Priority Bugs** | 4 |
| **Medium Bugs** | 5 |
| **Low Bugs** | 3 |
| **Backend Status** | Not implemented (mock data only) |
| **Auth Status** | UI only, non-functional |
| **Test Coverage** | 0% (no tests exist) |
| **Production Readiness** | Not ready - needs backend, auth, and tests |

The African Youth Database has a **strong, well-architected frontend** with comprehensive data modeling, beautiful UI, and solid component organization. The primary gap is the complete absence of a backend - all data is simulated client-side. Implementing a backend with real authentication and a database is the critical next step before this platform can serve real users.
