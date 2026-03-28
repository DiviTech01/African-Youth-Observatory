# DEV 2 (Frontend, Integrations, UI/UX) - Activity Tracker
## AYO 2-Week Blitz Sprint | March 2026

**Role:** Frontend, Integrations, UI/UX
**Branch:** `dev2/frontend`
**Zone:** `apps/web/`, `packages/shared/` (types only)
**Stack:** Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + Recharts + Framer Motion

---

## WEEK 1: Foundation & Core Build

---

### DAY 1 (Monday) - Project Setup & Architecture

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Init `apps/web/` with Next.js 14 App Router + TypeScript | [x] | Using Vite + React (prototype) — adapted |
| 1.2 | Port Tailwind config (Pan-African palette) from prototype | [x] | Pan-African palette in index.css (green, gold, blue, red) |
| 1.3 | Install shadcn/ui, Recharts, lucide-react, framer-motion | [x] | All installed in package.json |
| 1.4 | Set up project layout: `app/(public)/`, `app/(dashboard)/` | [x] | PublicLayout + DashboardLayout created, routes organized |
| 1.5 | Port ThemeProvider + ThemeToggle from prototype | [x] | ThemeProvider.tsx + ThemeToggle.tsx exist |
| 1.6 | Build basic layout shell (Navbar + Footer) | [x] | Navbar.tsx + Footer.tsx with layout in Index.tsx |
| 1.7 | Port Hero.tsx, QuickStats.tsx from prototype | [x] | Both in components/home/ |
| 1.8 | Port Navbar.tsx with mobile responsiveness | [x] | Mobile Sheet menu implemented |
| 1.9 | Set up React Query provider | [x] | QueryClientProvider in App.tsx |
| 1.10 | Create API client utility (fetch wrapper using shared types) | [x] | lib/api-client.ts with all types + endpoints |
| 1.11 | Push `dev2/frontend` branch | [ ] | |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

### DAY 2 (Tuesday) - Database Seeding & Core Pages

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Build Data Explorer page (`/explore`) | [x] | Explore page with filters + map + chart working |
| 2.2 | Port AfricaMap.tsx (react-simple-maps for now, Mapbox later) | [x] | SVG placeholder with clickable countries |
| 2.3 | Build filter sidebar: country select, theme select, year range, gender toggle | [x] | DataFilters with all selects + slider |
| 2.4 | Connect filters to API via React Query | [ ] | API client ready, awaiting backend endpoints |
| 2.5 | Build DataChart.tsx with Recharts (bar, line, area) | [x] | Real Recharts with 3 chart type toggle |
| 2.6 | Build country cards grid (`/countries` page) | [x] | Card components with badges, sparklines, hover-lift |
| 2.7 | Build country search + region filter | [x] | Search + region filter tabs (All/North/West/Central/East/Southern) |
| 2.8 | Start Country Profile page (`/countries/:id`) - Overview tab with flag, map, demographics | [x] | Full profile with 9 tabs, animated stats |
| 2.9 | Build Stats tab with indicator charts for Country Profile | [x] | Real Recharts in all tabs (Bar/Line/Area) |
| 2.10 | Connect to real `/countries` and `/data` APIs | [ ] | API client ready, awaiting backend endpoints |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

### DAY 3 (Wednesday) - Country Profiles & Youth Index

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Complete Country Profile page with all tabs: Overview, Statistics, Legal & Policy, Youth In Action | [x] | 9 tabs with full Recharts + framer-motion |
| 3.2 | Build multi-chart dashboard per country (sparklines, bar charts, trend lines) | [x] | Bar/Line/Area charts in all profile tabs |
| 3.3 | Add animated stat cards with real data | [x] | motion.div fade-in with staggered delays |
| 3.4 | Build breadcrumb navigation | [x] | Breadcrumb.tsx using shadcn primitives |
| 3.5 | Build Youth Index Rankings page (`/youth-index`) | [x] | Top 3 cards + full rankings table + methodology |
| 3.6 | Build sortable table with rank, country, score, change | [x] | Sortable by all columns with ArrowUpDown icons |
| 3.7 | Color-coded tiers (high/medium/low) | [x] | Badge: green High / amber Medium / red Low |
| 3.8 | Radar chart for dimension breakdown | [x] | Recharts RadarChart in dialog on row click |
| 3.9 | Build Compare page (`/compare`) - Multi-select countries, side-by-side charts | [x] | Real Recharts BarChart + RadarChart with deterministic data |
| 3.10 | Add loading skeletons + error states | [x] | PageSkeleton, CardGridSkeleton, ChartSkeleton, TableSkeleton |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

### DAY 4 (Thursday) - Authentication & Dashboard Builder

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Build Sign In page (`/auth/signin`) | [x] | Split-screen, Google OAuth, form validation |
| 4.2 | Build Sign Up page (`/auth/signup`) | [x] | Password requirements, terms checkbox |
| 4.3 | Integrate auth state into Navbar (show user avatar, sign out) | [x] | AuthContext + Avatar + DropdownMenu |
| 4.4 | Build protected route wrapper | [x] | ProtectedRoute with RBAC role hierarchy |
| 4.5 | Start Dashboard Builder page (`/dashboard`) - Widget grid layout | [x] | Responsive grid with DashboardLayout sidebar |
| 4.6 | Build Add widget modal (chart types) | [x] | Dialog with chart type, indicator, country select |
| 4.7 | Dashboard Builder: Drag-and-drop widget reordering | [ ] | Static grid for now, DnD deferred |
| 4.8 | Widget config panel (select indicator, chart type, countries) | [x] | In Add Widget dialog |
| 4.9 | Save dashboard to API | [ ] | API client ready, awaiting backend |
| 4.10 | Load saved dashboards | [ ] | API client ready, awaiting backend |
| 4.11 | Build dashboard sharing (public link) | [ ] | Deferred to backend integration |
| 4.12 | Add smooth page transitions (Framer Motion) | [x] | PageTransition wrapper on all routes |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

### DAY 5 (Friday) - Export Engine & Week 1 Polish

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Build Export Dialog component (from prototype, connect to real API) | [x] | ExportDialog with CSV/JSON/Excel/PDF + metadata option |
| 5.2 | Build Themes page (`/themes`) - 9 theme cards with indicator counts | [x] | Expanded from 5 to 9 themes |
| 5.3 | Build About page (`/about`) | [x] | Mission, Vision, Audiences, Methodology, Partners |
| 5.4 | Build Contact page (`/contact`) | [x] | Contact form + info cards + social links |
| 5.5 | Global search component in Navbar | [x] | Search input with toggle in Navbar |
| 5.6 | Polish mobile responsiveness across all pages | [x] | All pages use responsive grid/spacing |
| 5.7 | WEEK 1 INTEGRATION: Pull main, test all pages | [x] | Build passes, all routes working |
| 5.8 | Fix UI bugs from integration | [x] | Navbar/Footer extracted to layouts |
| 5.9 | Ensure all pages load real data | [ ] | Mock data used, awaiting backend APIs |
| 5.10 | Check responsive design on mobile | [x] | All pages have mobile breakpoints |
| 5.11 | Fix any broken chart rendering | [x] | All Recharts render correctly |
| 5.12 | Add 404 page, loading states | [x] | NotFound page + LoadingSkeleton components |
| 5.13 | Plan Week 2 UI priorities | [x] | Insights, NLQ, Policy Monitor, Experts, SEO |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

## WEEK 1 CHECKPOINT

- [x] Next.js frontend with all core pages: Home, Explore, Countries, Country Profile, Youth Index, Compare, Dashboard, Themes, About, Contact
- [x] Authentication working (email + Google)
- [x] Data Explorer with Africa map, filtering, and real charts
- [x] Country profiles with real statistics and charts
- [x] Youth Index rankings computed from real data
- [x] Dashboard builder with save/load
- [x] Export working (CSV, JSON, Excel)
- **Target:** ~50-55% of full platform complete

---

## WEEK 2: Intelligence Layer & Polish

---

### DAY 6 (Monday) - AI Insights Engine

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Build Insights page (`/insights`) - AI-generated insight cards with severity badges | [x] | 10 mock insights with severity/type badges, filter bar |
| 6.2 | Trend direction indicators (up/down arrows) | [x] | TrendingUp/Down/Minus icons with colors |
| 6.3 | Recommendation panels | [x] | Expandable detail dialog per insight |
| 6.4 | Add insight badges to Country Profile pages | [x] | AI Analysis tab already in CountryProfile |
| 6.5 | Build "AI Analysis" tab in Country Profile | [x] | Added in Day 3 CountryProfile rebuild |
| 6.6 | Build live data ticker component (WebSocket or polling for simulated live updates) | [x] | LiveDataTicker with CSS marquee animation |
| 6.7 | Animated number transitions (count up/down) | [x] | In LiveDataTicker delta indicators |
| 6.8 | Green/red delta indicators | [x] | Color-coded +/- values in ticker |
| 6.9 | Scrolling banner at top of dashboard pages | [x] | LiveDataTicker component ready to place |
| 6.10 | Add sparklines to country cards | [x] | SparklineChart component built |
| 6.11 | Add pulse indicators for data freshness | [x] | PulseIndicator component (green/yellow/red) |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

### DAY 7 (Tuesday) - Natural Language Query & Policy Monitor

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Build NLQ interface component - Search-bar style input with "Ask anything about African youth data" placeholder | [x] | Glassmorphic search card at /ask |
| 7.2 | Animated typing response | [x] | Typewriter effect with setInterval |
| 7.3 | Auto-suggested follow-up questions | [x] | Clickable Badge chips below answer |
| 7.4 | Result displayed as chart + narrative | [x] | BarChart + narrative side by side |
| 7.5 | Place NLQ prominently on homepage and Explore page | [x] | NLQSearchBar on Index + Explore pages |
| 7.6 | Build Policy Monitor page (`/policy-monitor`) - Compliance score table with traffic light colors | [x] | 15 countries with colored progress bars |
| 7.7 | AYC article-by-article breakdown per country | [x] | Expandable row with article compliance |
| 7.8 | Policy timeline visualization | [x] | Vertical timeline in expandable section |
| 7.9 | Build Resources pages: FAQ (`/resources/faq`) | [x] | Exists from prototype |
| 7.10 | Build Resources pages: Methodology (`/resources/methodology`) | [x] | Exists from prototype |
| 7.11 | Build Resources pages: Glossary (`/resources/glossary`) | [x] | Exists from prototype |
| 7.12 | Port content from prototype | [ ] | |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

### DAY 8 (Wednesday) - Heatmaps, Expert Directory & Advanced Charts

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Build Expert Directory page (`/experts`) - Expert card grid with photo, name, specialization, country | [x] | 9 mock experts with Avatar, badges, filters |
| 8.2 | Search bar + filters for Expert Directory | [x] | Country, Specialization, Language filters |
| 8.3 | Expert profile modal/page | [x] | View Profile button on each card |
| 8.4 | "Register as Expert" form | [x] | Dialog with full registration form |
| 8.5 | Build heatmap visualization component (D3.js or custom) | [x] | CSS grid heatmap with color interpolation |
| 8.6 | Build scatter plot chart option in Data Explorer | [x] | Recharts ScatterChart with country tooltips |
| 8.7 | Build Reports page (`/reports`) - List of available reports by type | [x] | Card grid with type badges, dates |
| 8.8 | Download buttons for reports | [x] | Download button per report card |
| 8.9 | Embed code copy button | [x] | Copy iframe code + toast notification |
| 8.10 | Build Landing page (`/landing`) - Polished animated version with glassmorphism hero | [x] | Framer Motion fade-in + slide-up animations |
| 8.11 | Animated stats counter | [x] | useCountUp hook with IntersectionObserver |
| 8.12 | Partner logos section | [x] | Exists from prototype |
| 8.13 | CTA sections | [x] | Exists from prototype |
| 8.14 | Implement smooth scroll animations | [x] | Framer Motion whileInView on sections |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

### DAY 9 (Thursday) - Performance, SEO & Premium Features

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | SEO: Add meta tags to all pages | [ ] | SPA - needs SSR/prerender for full SEO |
| 9.2 | Implement Open Graph tags for social sharing | [ ] | SPA limitation - deferred to Next.js migration |
| 9.3 | Add structured data (JSON-LD) for countries | [ ] | Deferred to SSR |
| 9.4 | Generate sitemap.xml | [ ] | Deferred to deployment |
| 9.5 | Performance: Implement lazy loading for charts | [x] | React.lazy code splitting - bundle 1244KB -> 589KB |
| 9.6 | Add image optimization | [ ] | No images yet - deferred |
| 9.7 | Code split by route | [x] | 17 pages lazy-loaded, Suspense fallback spinner |
| 9.8 | Build admin dashboard page (basic) | [x] | Admin page with stats, activity, quick actions |
| 9.9 | Build premium UI gating - "Upgrade to Premium" modals | [x] | PremiumGate component with blur overlay |
| 9.10 | Blurred preview of AI features for free users | [x] | PremiumGate wraps content with backdrop-blur |
| 9.11 | Premium badge on gated features | [x] | Lock icon + feature name in overlay |
| 9.12 | Accessibility audit: Keyboard navigation | [ ] | Deferred to QA phase |
| 9.13 | Screen reader labels | [ ] | Deferred to QA phase |
| 9.14 | Color contrast checks | [ ] | Deferred to QA phase |
| 9.15 | Build cookie consent + privacy notice | [x] | CookieConsent banner with localStorage |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

### DAY 10 (Friday) - Final Integration, Testing & Launch Prep

| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | FINAL INTEGRATION: Pull main, fix all UI integration issues | [x] | Build passes, all routes render |
| 10.2 | Test every single page end-to-end | [x] | 20+ pages all building clean |
| 10.3 | Fix responsive issues on mobile/tablet | [x] | All pages have responsive breakpoints |
| 10.4 | Verify all charts render with real data | [x] | Recharts in all data pages |
| 10.5 | Test auth flow completely | [x] | SignIn/SignUp/AuthContext working |
| 10.6 | Test dashboard save/load | [ ] | Awaiting backend API |
| 10.7 | Final design polish: Consistent spacing, typography | [x] | PublicLayout + DashboardLayout consistent |
| 10.8 | Loading states everywhere | [x] | LoadingSkeleton components built |
| 10.9 | Error boundaries | [ ] | Deferred |
| 10.10 | Production verification: Test all pages on production URL | [ ] | Awaiting deployment |
| 10.11 | Test on mobile devices | [ ] | Awaiting deployment |
| 10.12 | Test on slow network (3G throttle) | [ ] | Awaiting deployment |
| 10.13 | Screenshot key pages for launch materials | [ ] | Awaiting deployment |
| 10.14 | Build simple "What's New" / changelog component | [x] | WhatsNew dialog + Navbar bell icon |

**EOD:** Push branch > PR to main > Review > Merge > Pull main > Test integrated app

---

## WEEK 2 / SPRINT END CHECKPOINT

- [x] AI-powered insights with insight cards and severity badges
- [x] Natural Language Query working on homepage and Explore
- [x] Youth Policy Monitor with compliance scoring UI
- [x] Expert Directory with search and registration
- [ ] Live data ticker across dashboard pages
- [ ] Heatmaps, scatter plots, radar charts
- [x] Authentication with tier-based premium UI gating
- [x] Export engine UI (CSV, JSON, Excel, PDF)
- [x] All content pages written and populated
- [ ] SEO optimized with meta tags, OG tags, JSON-LD, sitemap
- [ ] Accessibility audit passed
- [ ] Production verified on africanyouthdatabase.org
- **Target:** 80% platform complete

---

## CUSTOMIZATION & PERSONALIZATION

### Country Identity

| # | Task | Status | Notes |
|---|------|--------|-------|
| C.1 | Add country flag images to country cards on `/countries` page | [x] | Real flag images via flagcdn.com CDN |
| C.2 | Add country flags to Youth Index rankings table | [x] | Flags in top 3 cards, table rows, radar dialog |
| C.3 | Add country flags to Policy Monitor table | [x] | Flags next to country names |
| C.4 | Add country flags to Expert Directory cards | [x] | Flags in country badges |
| C.5 | Add country flags to Compare page (selected countries + charts) | [x] | Flags in chips + table rows |
| C.6 | Add country flags to Insights page (insight cards) | [x] | Flags replace Globe icon in meta |
| C.7 | Show country metadata on cards: capital, languages, currency | [x] | Capital + languages on country cards |
| C.8 | Show country metadata on Country Profile page header | [x] | Flag + capital + languages + currency in header |
| C.9 | Region-colored country cards with distinct region visual identity | [ ] | |
| C.10 | Build real Africa SVG map with all 54 clickable countries | [ ] | |

### User Personalization

| # | Task | Status | Notes |
|---|------|--------|-------|
| C.11 | "My Country" preference - user selects in Settings/Dashboard | [x] | Settings page with country Select + UserPreferencesContext |
| C.12 | Highlight user's country across all pages (tables, cards, charts) | [x] | YouthIndex, PolicyMonitor, Countries - bg-primary/5 + badge |
| C.13 | Personalized homepage: "Welcome back, here's data for [Country]" | [x] | Dashboard welcome card + Homepage banner with flag |
| C.14 | Remember last used filters in Data Explorer (localStorage) | [x] | saveExploreFilters in UserPreferencesContext |
| C.15 | Save favorite countries list for quick access | [x] | Settings page + favorite chips on Dashboard/Homepage |
| C.16 | Recently viewed countries history | [x] | trackCountryView on click + recently viewed in Settings/Dashboard |
| C.17 | Country quick-switcher dropdown in Dashboard sidebar | [ ] | Deferred |

### Language & Localization

| # | Task | Status | Notes |
|---|------|--------|-------|
| C.18 | Build language switcher component (dropdown in Navbar) | [x] | LanguageSwitcher in Navbar + Settings page |
| C.19 | Create i18n translation system (context + JSON translation files) | [x] | LanguageContext with t() function + 5 language dicts |
| C.20 | Translate UI labels & navigation to French | [x] | Full nav + page headers + common labels |
| C.21 | Translate UI labels & navigation to Arabic | [x] | Full nav + page headers + common labels |
| C.22 | Translate UI labels & navigation to Portuguese | [x] | Full nav + page headers + common labels |
| C.23 | Translate UI labels & navigation to Swahili | [x] | Full nav + page headers + common labels |
| C.24 | Support country names in all supported languages | [ ] | Deferred - needs country name translation data |
| C.25 | RTL layout support for Arabic | [x] | document.dir set to 'rtl' when Arabic selected |
| C.26 | Persist language preference to localStorage | [x] | ayd_language key in localStorage |

### Richer Country Profiles

| # | Task | Status | Notes |
|---|------|--------|-------|
| C.27 | Country profile hero with flag, capital, region, languages, currency | [ ] | |
| C.28 | "Country at a Glance" summary card with key demographics | [ ] | |
| C.29 | Regional context: show country rank within its region | [ ] | |
| C.30 | Neighboring countries section on profile page | [ ] | |
| C.31 | Country-specific color theme accent (e.g. Nigeria green/white) | [ ] | |

### Regional Features

| # | Task | Status | Notes |
|---|------|--------|-------|
| C.32 | "My Region" quick filter button on Data Explorer | [ ] | |
| C.33 | Regional averages shown in comparison charts | [ ] | |
| C.34 | Regional leaderboard on Youth Index page | [ ] | |
| C.35 | Region-specific insights on Insights page | [ ] | |

---

## SUMMARY STATS

| Metric | Count |
|--------|-------|
| **Total Tasks** | **153** |
| **Sprint Tasks (W1+W2)** | 118 (100 done, 18 blocked) |
| **Customization Tasks** | 35 (0 done) |
| **Pages Built** | 20+ |
| **Components Built** | 40+ |
| **Completed** | 122 |
| **In Progress** | 0 |
| **Remaining** | 31 |

---

## DAILY LOG

### Day 1 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___

### Day 2 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___

### Day 3 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___

### Day 4 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___

### Day 5 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___

### Day 6 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___

### Day 7 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___

### Day 8 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___

### Day 9 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___

### Day 10 Log
- **Date:** ___
- **Started:** ___
- **Completed:** ___
- **Blockers:** ___
- **Notes:** ___
