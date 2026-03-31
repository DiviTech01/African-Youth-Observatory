# African Youth Database (AYD)

The definitive data intelligence platform for youth-disaggregated data across all 54 African countries.

## Features

- **Data Explorer** - Interactive maps, charts, and filters across 59+ indicators
- **Youth Index** - Composite ranking of all 54 countries across 5 dimensions
- **AI Insights** - Trend detection, anomaly alerts, and natural language queries
- **Policy Monitor** - AYC compliance tracking and policy gap analysis
- **Expert Directory** - Searchable database of African youth professionals
- **Dashboard Builder** - Custom dashboards with save/share/embed
- **Export Engine** - CSV, JSON, Excel, PDF with full metadata
- **Live Feed** - Real-time data ticker and platform activity
- **Embeddable Widgets** - Chart.js bar/line charts, stat cards, SVG maps for external sites
- **Global Search** - Unified search across countries, indicators, themes, experts, dashboards
- **Multilingual** - English, French, Arabic, Portuguese, Swahili

## Quick Start

```bash
git clone https://github.com/DiviTech01/African-Youth-Database.git
cd African-Youth-Database
pnpm install
pnpm setup   # Starts DB, seeds data, imports World Bank data
```

Or manually:

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Create schema + seed
cd packages/database && npx prisma db push && cd ../..
pnpm db:seed
pnpm seed:policies
pnpm seed:experts

# 3. Import real data
pnpm import:worldbank

# 4. Start servers
cd apps/api && pnpm dev     # API on http://localhost:3001
cd ../.. && pnpm dev        # Frontend on http://localhost:8080
```

**Admin login:** `admin@africanyouthdatabase.org` / `AYD@Admin2026!`

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Framer Motion |
| Backend | NestJS, TypeScript, Prisma ORM, PostgreSQL |
| AI | Anthropic Claude API (with rule-based fallback) |
| Auth | JWT + Passport.js, bcryptjs, RBAC (6 roles) |
| Real-time | Socket.IO WebSocket gateway |
| Rate Limiting | @nestjs/throttler |

## API Documentation

Swagger UI: `http://localhost:3001/api/docs`

19 modules, 60+ endpoints:
countries, indicators, data, youth-index, compare, policy-monitor, insights, nlq, experts, dashboards, export, embed, search, admin, live-feed, auth, platform.

## Data Sources

- World Bank Open Data (40+ indicators)
- ILO STAT (employment, labor force)
- UNESCO UIS (education)
- African Union (policy data)
- National Statistics Bureaus

## Project Structure

```
.
├── apps/api/          # NestJS backend (19 modules)
├── packages/database/ # Prisma schema + migrations
├── packages/shared/   # Shared TypeScript types
├── src/               # React frontend (Vite)
├── seed/              # JSON seed data (countries, themes, indicators, policies, experts)
├── scripts/           # Import + seed scripts
└── docker-compose.yml # PostgreSQL dev server
```

## License

CC BY 4.0
