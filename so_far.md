# African Youth Database — Project Status (`so_far.md`)

_Last updated: 2026-04-23_

A single source of truth for everything about this project — what it is, what's built, what's broken, what's left. Read this top-to-bottom to understand the whole picture, including the parts that haven't worked.

---

## 1. What we're building

**The African Youth Database (AYD)** — a continental-scale data intelligence platform covering youth development across all **54 African countries**. It surfaces indicators on education, employment, health, civic engagement, innovation, demographics, economy, infrastructure, and social outcomes. It ships:

- A public **data explorer** (map, charts, filters, comparison, search)
- A composite **Youth Development Index** ranking all 54 countries across 5 dimensions
- An **AI assistant** (Claude-powered) for natural-language data questions, insight generation, and document authoring
- A **policy monitor** that scores AYC (African Youth Charter) compliance
- An **expert directory** of African youth professionals
- **Custom dashboards**, **exports**, **embeddable charts**, and a **real-time feed** of platform activity
- A full **admin panel** for data imports, user role management, and index recomputation

Aimed at researchers, policymakers, NGOs, journalists, and students. Built to be a public good with tiered access (public → registered → researcher → contributor → institutional → admin).

---

## 2. Architecture at a glance

```
┌─────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE PAGES                     │
│                 (Frontend — Vite/React build)               │
└─────────────┬───────────────────────────────────────────────┘
              │   HTTPS / JSON
              ▼
┌─────────────────────────────────────────────────────────────┐
│                          RENDER.COM                         │
│        NestJS API (apps/api) — port 3001 in prod           │
│   Claude API ← AI chat/NLQ/insights                         │
│   Resend    ← transactional email                           │
└─────────────┬───────────────────────────────────────────────┘
              │   Prisma
              ▼
┌─────────────────────────────────────────────────────────────┐
│              MANAGED POSTGRES (production)                  │
│            Local Docker postgres:15-alpine (dev)            │
└─────────────────────────────────────────────────────────────┘
```

**Monorepo layout** (Bun-managed workspaces, no pnpm):
- `apps/web` — React + Vite frontend
- `apps/api` — NestJS backend
- `packages/database` — Prisma schema + client
- `packages/shared` — shared TypeScript types
- `seed/` — JSON seed data
- `scripts/` — import / compute / smoke-test scripts
- `data/raw/pacsda/` — source Excel files (AYC scorecard, AYIMS datasheet)

---

## 3. Tech stack — full inventory

### Frontend (`apps/web`)
- **React** 18.3.1, **React DOM** 18.3.1
- **Vite** 5.4.1 with `@vitejs/plugin-react-swc` 3.5.0
- **React Router DOM** 6.26.2
- **TanStack React Query** 5.56.2
- **Tailwind CSS** 3.4.11, `tailwindcss-animate` 1.0.7, `@tailwindcss/typography` 0.5.15
- **shadcn/ui** (40+ components built on Radix UI primitives)
- **Radix UI** (30+ component packages — dialog, popover, scroll-area, etc.)
- **Recharts** 2.12.7 — all charts
- **React Simple Maps** 3.0.0 — Africa choropleth
- **Lucide React** 0.462.0 — icons
- **React Hook Form** 7.53.0 + **Zod** 3.23.8 — forms + validation
- **Sonner** 1.5.0, `@radix-ui/react-toast` — notifications
- **date-fns** 3.6.0, **cmdk** 1.0.0, **vaul** 0.9.3
- **next-themes** 0.4.6 — dark/light mode

### Backend (`apps/api`)
- **NestJS** 10.4.1 suite:
  - `@nestjs/common`, `/core`, `/platform-express`, `/platform-socket.io`
  - `@nestjs/jwt`, `/passport`
  - `@nestjs/swagger` — auto-generated OpenAPI docs at `/api/docs`
  - `@nestjs/throttler` — rate limiting (10 req/min on AI, exports, NLQ)
  - `@nestjs/websockets` + **socket.io** 4.8.3 — live feed
- **Prisma** 5.22.0 (pinned — differs from root 5.19.1 on purpose)
- **Anthropic SDK** `@anthropic-ai/sdk` 0.82.0 — Claude integration
- **Passport** 0.7.0, `passport-jwt` 4.0.1, `passport-local` 1.0.0
- **bcryptjs** 3.0.3 — password hashing (cost 12)
- **Resend** 6.12.2 — transactional email
- **xlsx** 0.18.5 — Excel/CSV I/O
- **Multer** 2.1.1 — file uploads
- **class-validator** 0.14.1, **class-transformer** 0.5.1
- **reflect-metadata**, **rxjs** 7.8.1

### Infrastructure & tooling
- **TypeScript** 5.5.3 everywhere
- **PostgreSQL** 15 (docker-compose for local)
- **Docker** — two Dockerfiles (root simple, `apps/api/Dockerfile` multi-stage)
- **Cloudflare Wrangler** 4.81.0 — Pages deploy (`wrangler.toml`)
- **Render.com** — backend hosting (https://african-youth-observatory.onrender.com)
- **Bun** — primary package manager (`bun.lockb` committed; pnpm/npm both removed from the workspace after build-system churn)
- **Electron** 41.2.2 + **electron-builder** 26.8.1 — present in root deps (desktop-app ambition; not actively used)

---

## 4. Database schema (Prisma / PostgreSQL)

Location: `apps/api/prisma/schema.prisma`. **15 models, 6 enums.** Full inventory:

**Geography**
- `Country` — 54 rows. Name, ISO codes, region enum, capital, population (BigInt), youthPopulation, area, currency, languages[], economicBlocs[], lat/lng, flagEmoji
- `Region` enum — `NORTH_AFRICA | WEST_AFRICA | CENTRAL_AFRICA | EAST_AFRICA | SOUTHERN_AFRICA`

**Data model**
- `Theme` — 9 thematic areas (Education, Employment, Health, Civic, Innovation, Demographic, Economic, Infrastructure, Social)
- `Indicator` — 59+ indicators, each linked to a theme; fields include unit enum, source, methodology, frequency
- `IndicatorUnit` enum — `PERCENTAGE | NUMBER | INDEX | RATIO | RATE | CURRENCY | SCORE | YEARS`
- `IndicatorValue` — the fact table. `(countryId, indicatorId, year, gender, ageGroup)` is unique. Includes `confidence`, `isEstimate`, `source`.
- `GenderType` enum — `MALE | FEMALE | TOTAL`

**Analytics**
- `YouthIndexScore` — per country per year. 5 dimension scores (education, employment, health, civic, innovation) + overall. Includes `rank`, `previousRank`, `rankChange`, `percentile`, `tier`.
- `IndexTier` enum — `HIGH | MEDIUM_HIGH | MEDIUM | MEDIUM_LOW | LOW`

**Policy & experts**
- `CountryPolicy` — policy-by-policy tracking. AYC ratification, WPAY compliance, complianceScore (0–100), status
- `Expert` — directory of verified professionals. Specializations[], languages[], bio, verified flag

**Users & personalization**
- `User` — email (unique), passwordHash (bcrypt), role, organization, resetToken + expiry
- `UserRole` enum — `PUBLIC | REGISTERED | RESEARCHER | CONTRIBUTOR | INSTITUTIONAL | ADMIN`
- `Dashboard` — JSON `layout` + JSON `widgets`, `isPublic` flag, user-owned
- `DataSource` — metadata for ingestion sources, `lastSync`

Indexes are set on common query paths (country+indicator+year, region, rank, resetToken).

---

## 5. Backend — module-by-module status

**19 NestJS modules in `apps/api/src/modules/`.** Plus shared infrastructure under `apps/api/src/common/`.

### Core data (4)
| Module | Endpoints | Status |
|---|---|---|
| `countries` | GET `/countries`, `/countries/:id`, `/countries/regions`, `/countries/:id/stats` | ✅ Wired to real data |
| `themes` | GET `/themes`, `/themes/:id` | ✅ Wired |
| `indicators` | GET `/indicators`, `/indicators/:id`, `/indicators/:id/values` | ✅ Wired |
| `data` | GET `/data/values`, `/data/timeseries`, `/data/comparison`, `/data/map`, `/data/bar-chart`, `/data/regional-averages` | ✅ Wired, supports gender/year-range filters |

### Analysis (5)
| Module | Endpoints | Status |
|---|---|---|
| `youth-index` | GET `/youth-index/rankings`, `/top/:n`, `/most-improved/:n`, `/:countryId`; POST `/compute`, `/compute-all` (admin) | ✅ Working; compute script exists |
| `compare` | POST `/compare/countries`, `/compare/indicators`, `/compare/themes` | ✅ Working |
| `insights` | GET `/insights/country/:id`, `/trend/:indicatorId/:countryId`, `/anomalies`, `/correlations`, `/narrative/:countryId` | ✅ Logic present; 3 services: `InsightsService`, `CountryNarrativeService`, `AiService` |
| `nlq` | POST `/nlq/query`, `/nlq/query/natural-language` | ✅ Rule-based fallback; tool-use via Claude when key present. Rate-limited 10/min |
| `ai-chat` | POST `/ai/chat` | ✅ **Just upgraded** — now accepts `history[]` for multi-turn context. Falls back to NLQ if no `ANTHROPIC_API_KEY` |

### Feature modules (8)
| Module | Notes | Status |
|---|---|---|
| `policy-monitor` | Rankings, summary, per-country detail; `ComplianceScorerService` scores on 7 components | ✅ Built |
| `expert-directory` | List/search/filter; verified flag | ⚠️ Expert **approval workflow** partially built (recent commit) — needs verification |
| `dashboards` | Full CRUD + `/clone`; JSON layouts/widgets | ✅ Built, needs end-to-end test |
| `export` | CSV / JSON / Excel / PDF. Row caps by role (public 100, registered 10k, admin 50k). Rate-limited 10/min. **Gated behind auth + invite modal** (recent commit) | ✅ Built |
| `embed` | Generates shareable chart HTML (bar/line/stat/SVG map) | ✅ Built |
| `search` | Unified search across countries/indicators/themes/experts/dashboards | ✅ Built |
| `live-feed` | Socket.IO gateway; broadcasts imports, policy changes, new experts | ⚠️ Gateway exists, **not end-to-end tested** |
| `data-upload` | POST `/data-upload` (CSV), `/templates`, `/gaps`. CONTRIBUTOR+ only | ⚠️ Happy path works; malformed-CSV validation untested |

### Infrastructure (5)
| Module | Notes | Status |
|---|---|---|
| `auth` | JWT, signup/signin, profile get/update, forgot/reset, contact form | ✅ Recently wired to real JWT on sign-in/sign-up pages |
| `admin` | Import (WB/CSV), data gaps, recompute index, users CRUD, role changes, clear-cache, `/system` diagnostics | ✅ Built, admin-only |
| `mail` (Resend) | `sendPasswordReset`, `sendContactFormNotification` | ⚠️ Integrated but **not verified end-to-end** in production |
| `platform` | GET `/api/health`, `/api/platform/stats` | ✅ |
| `common` (prisma, filters, interceptors, cache, guards, decorators, `RlsMiddleware`) | `RlsMiddleware` is a placeholder for row-level security (not enforced) | ⚠️ RLS scaffold only |

---

## 6. Frontend — page-by-page status

**15 pages** (14 top-level + 5 sub-routes) in `apps/web/src/pages/`:

| Route | File | Status |
|---|---|---|
| `/` | `Index.tsx` | ✅ Home, real data via API |
| `/landing` | `Landing.tsx` | ✅ Marketing splash |
| `/explore` | `Explore.tsx` + `components/explore/*` | ✅ Map, filters, chart, scatter, heatmap |
| `/countries` | `Countries.tsx` | ✅ Grid, search, region filter |
| `/themes` | `Themes.tsx` | ✅ All 9 thematic areas |
| `/youth-index` | `YouthIndex.tsx` | ✅ Rankings, top performers, radar |
| `/compare` | `Compare.tsx` | ⚠️ **Still contains a `Generate consistent mock data` path** in `CountryComparison.tsx:77` |
| `/insights` | `Insights.tsx` + `InsightsDashboard.tsx` | ✅ AI insights dashboard (display-only) |
| `/ask-ai` | `AskAI.tsx` | ✅ **Just built** — full Claude chat page (see §9) |
| `/dashboard` | `Dashboard.tsx` + `DashboardBuilder.tsx` | ⚠️ Builder renders; authenticated flow not fully smoke-tested |
| `/reports` | `Reports.tsx` | ⚠️ Exists, minimal content |
| `/contact` | `Contact.tsx` | ✅ Wired to `/auth/contact` → Resend |
| `/about` | `About.tsx` | ✅ Static |
| `/auth/signin` | `auth/SignIn.tsx` | ✅ Real JWT |
| `/auth/signup` | `auth/SignUp.tsx` | ✅ Real JWT |
| `/resources/methodology` | `resources/Methodology.tsx` | ✅ |
| `/resources/glossary` | `resources/Glossary.tsx` | ✅ |
| `/resources/faq` | `resources/FAQ.tsx` | ✅ |
| `*` | `NotFound.tsx` | ✅ 404 |

**Frontend shared components:** Navbar (sticky, now includes "Ask AI" link), Footer, ThemeProvider, ThemeToggle, AuthContext (JWT in localStorage: `ayd_access_token`, `ayd_user`). 40+ shadcn UI primitives in `components/ui/`.

---

## 7. Authentication & authorization

- **Strategy:** JWT bearer tokens, passport-jwt. 24-hour expiry (configurable).
- **Password hashing:** bcryptjs, cost 12.
- **Reset flow:** UUID reset token with 30-minute expiry → emailed via Resend → `/auth/reset-password`.
- **RBAC:** 6 roles (PUBLIC, REGISTERED, RESEARCHER, CONTRIBUTOR, INSTITUTIONAL, ADMIN) enforced by `JwtAuthGuard` + `RolesGuard` + `@Roles(...)` + `@Public()` decorators.
- **Protected endpoints** (representative): all `/admin/*`, `POST /dashboards`, `POST /data-upload`, `POST /youth-index/compute*`, `POST /policy-monitor/compute`, profile routes, exports (auth-gated via invite modal).
- **Default dev admin:** `admin@africanyouthdatabase.org` / `AYD@Admin2026!` (change in prod).
- **Known gap:** `RlsMiddleware` is a stub — no row-level security enforcement yet.

---

## 8. AI integration (Claude)

**SDK:** `@anthropic-ai/sdk` 0.82.0. **Model:** `claude-sonnet-4-20250514` (configurable via `AI_MODEL`). **Fallback:** rule-based NLQ service if `ANTHROPIC_API_KEY` is unset.

**Surfaces that call Claude:**
1. `POST /api/ai/chat` — multi-turn chat (user-facing Ask AI page). **Just upgraded** to accept `history[]` array and use `max_tokens: 2048`. System prompt now instructs Claude to emit markdown for documents and a JSON block for visualizations (`bar | line | pie | area | table`).
2. `POST /api/nlq/query` — single-shot natural language → structured answer + visualization.
3. `insights/ai.service.ts` — country narratives, correlations, anomaly explanations.

**NLQ engine** (`nlq.service.ts`): 60+ indicator keyword mappings, all 54 countries recognized, 5 regions, 6 intent types (single_value, comparison, ranking, trend, regional, correlation). Works without Claude as a fallback.

---

## 9. The Ask AI page (just shipped)

Route: `/ask-ai`. File: `apps/web/src/pages/AskAI.tsx`.

**Features built in this session:**
- Claude-style chat layout: scrollable messages area on top, composer pinned to the bottom
- Collapsible chat-history sidebar, grouped by Today / Yesterday / date; persists in `localStorage` (`ayd_chat_sessions`, last 50 sessions)
- Welcome screen with 6 suggestion cards that disappears once the first message is sent (unemployment, education, health, top performers, regional analysis, generate report)
- Multi-turn conversation — full history sent to the backend for context
- File upload via paperclip button and full-screen drag-and-drop overlay; reads `.txt / .csv / .json / .md` and passes content as context
- Inline markdown renderer (headings, lists, bold/italic, inline code, code blocks)
- Visualization renderer via Recharts: `bar | line | area | pie | table` — auto-normalized from the AI's JSON block
- "Download as Document" button on longer responses → exports a fully styled, printable HTML report with AYD cover, TOC-friendly headings, footer branding
- Auto-resizing textarea; Enter to send, Shift+Enter for newline
- Auto-scroll to newest message; follow-up question chips

**Backend changes:** `ai-chat.controller.ts` DTO now has `history?: {role, content}[]`. `ai-chat.service.ts` passes history into Claude's `messages[]` and uses a richer system prompt.

**Not yet built on the AskAI page:**
- Streaming responses (current impl is request/response only)
- PDF generation (HTML export is printable → browser "Save as PDF" works, but there's no direct `.pdf` button)
- Parsing PDF / DOCX uploads (we only read text-based files)
- Edit / regenerate / branch from a message

---

## 10. Data pipeline

### Seed data (committed JSON, `seed/`)
- `countries.json` — 54 countries, full profile
- `themes.json` — 9 themes
- `indicators.json` — 59+ indicators
- `policies.json` — policy records per country
- `experts.json` — expert directory

### Raw sources (`data/raw/pacsda/`)
- `AYC_Composite_Policy_Index_Scorecard.xlsx` (49K)
- `AYIMS_Datasheet_2006_2016_2025.xlsx` (55K)

### Import / compute scripts (`scripts/`)
| Script | What it does | npm script |
|---|---|---|
| `import-worldbank.ts` | Pulls 40+ indicators from World Bank API | `import:worldbank` |
| `import-csv.ts` | Generic CSV importer with column mapping | `import:csv` |
| `import-ilo.ts` | ILO STAT employment/labor data | `import:ilo` |
| `import-ayims.ts` | AYIMS datasheet → IndicatorValue rows | `import:ayims` |
| `import-ayc-scorecard.ts` | AYC policy scorecard → CountryPolicy | `import:ayc-scorecard` |
| `seed-policies.ts` | Seeds policy monitor | `seed:policies` |
| `seed-experts.ts` | Seeds expert directory | `seed:experts` |
| `compute-youth-index.ts` | Computes index for 2006, 2016, 2025 | `compute:youth-index` |
| `smoke-test.ts` | Hits health/countries/rankings endpoints | `smoke-test` |

Plus `apps/api/src/seed.ts` (run via `db:seed`) for the initial bootstrap.

---

## 11. Environment configuration

**Dev `.env.example`:**
```
DATABASE_URL=postgresql://ayd_user:ayd_password@localhost:5432/ayd_database
API_PORT=3001
NODE_ENV=development
VITE_API_URL=/api
JWT_SECRET=change-me
JWT_EXPIRES_IN=24h
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-sonnet-4-20250514
RESEND_API_KEY=re_...
FROM_EMAIL=African Youth Observatory <noreply@pacsda.org>
ADMIN_EMAIL=admin@africanyouthdatabase.org
FRONTEND_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:8080
```

**Production:** generate a 64-char `JWT_SECRET`, set `CORS_ORIGIN` to the real domain, set `VITE_API_URL` to the absolute API URL (relative paths are ignored in prod builds — see recent fix commit `4b2d1cf`).

---

## 12. Deployment

- **Frontend:** Cloudflare Pages — `wrangler.toml` sets `pages_build_output_dir = "dist"`, project name `african-youth-observatory`. **User instruction: do NOT redeploy to Cloudflare until told.**
- **Backend:** Render.com at `https://african-youth-observatory.onrender.com`.
- **Database:** managed Postgres in production; `docker-compose.yml` spins up `postgres:15-alpine` locally on port 5432 with a named volume `ayd_pgdata`.
- **Docker:** root `Dockerfile` (simple) and `apps/api/Dockerfile` (multi-stage production build).
- The repo was previously on Railway with Nixpacks/pnpm; pnpm workspaces were removed after build failures (commits `21b3ade`, `9f012d2`). Bun is the canonical package manager now.

---

## 13. What works end-to-end ✅

- Monorepo dev (`bun run dev` frontend, `bun run dev:api` backend)
- Postgres + Prisma migrations + seed
- Auth: signup, signin, JWT-protected routes, profile read/update
- Countries / themes / indicators / data endpoints hitting the real DB
- Youth Index rankings, top performers, most improved
- Compare countries on indicators
- Insights page displays AI-generated country insights
- NLQ endpoint (both Claude path and rule-based fallback)
- Ask AI page (full chat, history, attachments, visualizations, document export)
- Policy monitor rankings + per-country detail
- Expert directory listing and search
- Exports (CSV, JSON, Excel, PDF) with role-based row caps
- Search across countries / indicators / themes / experts
- Admin panel endpoints (imports, user management, recompute)
- Swagger API docs at `/api/docs`
- Health/platform stats endpoints
- Cloudflare Pages deploy working (don't redeploy until told)
- Render.com backend deploy working

---

## 14. What's partially working ⚠️

- **Expert approval workflow** — scaffolded in a recent commit, needs verification
- **Dashboard builder** — UI renders but the full create→save→load→clone flow hasn't been smoke-tested end-to-end
- **Socket.IO live-feed gateway** — module exists but real-time events aren't verified in production
- **Data upload validation** — happy path works; malformed/oversized CSV edge cases untested
- **Email (Resend)** — integrated and configured, not verified end-to-end in production (password reset, contact form notifications)
- **Insights → dashboard integration** — `dashboard.ts:618` still says `// Return placeholder - actual insights come from insights service`
- **`RlsMiddleware`** — stub only, no row-level security enforced
- **Reports page** — route exists with minimal content, not a full reports experience

---

## 15. What's broken / known issues ❌

- **Mock data still lingers in two places:**
  - `components/compare/CountryComparison.tsx:77` — `// Generate consistent mock data based on country`
  - `components/countries/CountryProfile.tsx:94` — `// Add mock indicator data for export`
  These need to be swapped for real API calls.
- **Duplicate old codebase at repo root** — there's a `src/` folder at the project root (separate from `apps/web/src/`) that is an earlier iteration of the frontend, dead code. Should be deleted to avoid confusion.
- **TODO/FIXME/HACK comments exist across ~77 files** — most are minor, but worth sweeping.
- **Prisma client version drift** — root uses 5.19.1, `apps/api` pins 5.22.0 (intentional for Render build). Confusing, worth documenting inline.
- **Electron dependencies in root `package.json`** — ambition for desktop app; not used; adds weight.
- **No CI/CD pipeline** — no `.github/workflows/` directory; deploys are manual (Cloudflare via Wrangler, Render via git push). No automated build/test gate on PRs.

---

## 16. What's not yet built 🔨

- **Test suite** — zero `.spec.ts` or `.test.ts` files in the whole repo. `TESTING.md` has a 19-section manual checklist.
- **Streaming AI responses** — Ask AI uses request/response; no token streaming.
- **PDF parsing** — Ask AI reads text files only; PDF/DOCX attachments aren't parsed.
- **Direct PDF download** — AI responses export as printable HTML; no one-click `.pdf`.
- **i18n implementation** — Footer has a language selector but translations aren't wired for the 5 target languages (EN, FR, AR, PT, SW).
- **Row-level security** — `RlsMiddleware` is a placeholder.
- **Rate limiting on auth endpoints** — only AI/export/NLQ are throttled; login could be brute-forced.
- **Email verification on signup** — account is active immediately; no verify-email step.
- **Password strength / complexity validation** — not enforced beyond basic length.
- **2FA / MFA** — not built.
- **Audit log** — admin actions aren't logged to a dedicated table.
- **Soft deletes** — hard deletes everywhere.
- **Data export watermarking / attribution** — no enforcement.
- **Terms of service / privacy policy pages** — not built.
- **Sitemap / robots.txt / SEO meta tags** — minimal.
- **Analytics (privacy-respecting)** — none wired in.
- **Error reporting (Sentry or similar)** — none.
- **Performance monitoring** — none.
- **Caching layer at API level** — `CacheService` exists but I haven't verified where it's used.
- **Backup strategy** — not documented.
- **Onboarding tour / first-run experience** — none.

---

## 17. Testing status

| Kind | Status |
|---|---|
| Unit tests | ❌ 0 files |
| Integration tests | ❌ 0 files |
| E2E tests | ❌ 0 files |
| Manual test checklist | ✅ `TESTING.md` (19 sections) |
| Smoke test script | ✅ `scripts/smoke-test.ts` (`npm run smoke-test`) — hits `/health`, `/countries`, `/youth-index/rankings` |

**Priority testing targets before launch:**
1. Auth flows (signup → verify → signin → protected route → logout)
2. `YouthIndexCalculatorService` — the composite score math
3. `ComplianceScorerService` — AYC scoring math
4. Export endpoints (role caps, file format integrity)
5. NLQ / Ask AI — prompt injection, oversized context, rate-limit behavior
6. Data upload — CSV with bad encoding, missing columns, SQL-unfriendly values
7. Admin role changes — can an admin demote themselves? Should they?

---

## 18. Honest completion estimate

| Layer | Completion | Remaining work |
|---|---|---|
| Database schema | **95%** | Minor: add audit log, soft-delete columns if desired |
| Backend API | **90%** | Testing, RLS, email end-to-end verification, live-feed verification |
| Frontend pages | **85%** | Kill mock data in Compare/CountryProfile, polish Dashboard+Reports, i18n |
| Authentication | **80%** | Email verification, rate-limit login, password complexity, 2FA (optional) |
| AI integration | **85%** | Streaming, PDF parsing, direct PDF export |
| Data pipeline | **90%** | Validate all import scripts against real data once more |
| Deployment | **85%** | CI/CD, staging env, error/perf monitoring |
| Testing | **5%** | Entire suite |
| Documentation | **75%** | This file + existing README/TESTING/PRD/SRS are solid; API docs live via Swagger; missing deployment runbook |
| **Overall toward a full production-ready tool** | **~78%** | Primary gaps: tests, CI/CD, i18n, a few mock-data swaps, production hardening (RLS, rate-limit login, email verification, monitoring) |

**Translation:** the product is **demo-ready and usable for beta users today**. To call it "production-ready software" (in the sense a funder/partner would accept without caveat) you need tests + CI/CD + the hardening items listed in §15–16.

---

## 19. Critical path to MVP launch (opinionated)

**Week 1 (must-do):**
1. Delete the duplicate root `src/` folder
2. Swap the two remaining mock-data spots in Compare + CountryProfile for real API calls
3. Verify email end-to-end (forgot password + contact form) against Resend
4. Add rate limiting to `/auth/signin` (currently unthrottled)
5. Run the full `TESTING.md` checklist manually and log findings

**Week 2:**
6. Write unit tests for `YouthIndexCalculatorService` + `ComplianceScorerService` (the math must be right)
7. Smoke-test every admin endpoint with a real admin account in production
8. End-to-end test dashboard builder: create → save → reload → clone → delete
9. Verify Socket.IO live-feed connects from Cloudflare Pages to Render (CORS + WSS)
10. Finish expert approval workflow

**Week 3–4 (polish):**
11. Wire i18n for at least EN/FR (the two highest-value languages continent-wide)
12. Add a basic GitHub Actions workflow: install → typecheck → build (a test step once tests exist)
13. Set up Sentry (or Highlight) for error reporting on both apps
14. Write a `DEPLOYMENT.md` runbook (Cloudflare + Render + DB migrations)
15. Ship a basic sitemap.xml + meta tags for SEO

---

## 20. Documentation inventory

Files already in the repo (read these to go deeper):
- `README.md` — quick start, tech stack, API overview
- `TESTING.md` — 19-section manual test checklist
- `AFRICAN YOUTH DATABASE - PRODUCT REQUIREMENTS DOCUMENT (PRD).md` — full product spec
- `AFRICAN YOUTH DATABASE - SOFTWARE REQUIREMENTS SPECIFICATION (SRS).md` — technical requirements
- `AYD — DATABASE SCHEMA & ER MODEL.md` — DB design doc
- `DEV2_ACTIVITY_TRACKER.md` — development activity log
- `finalized.md` — earlier codebase analysis
- `so_far.md` — **this file**
- `/api/docs` — live Swagger API docs (served by NestJS)
- `.claude/settings.local.json` — approved tool permissions

**No `CLAUDE.md`** yet — nothing specifying how to collaborate with the AI in this repo.

---

## 21. Recent git history (last 20 commits)

```
9218715  feat: interactive Africa map, upgraded charts, collapsible sidebar, AI chat, expert approval
d3e3ee8  feat: gate export/download behind auth with invite modal
2abadfd  chore: refresh bun.lockb to match package.json
4b2d1cf  fix: use hardcoded Render URL in production when VITE_API_URL is relative
ac83c6d  fix: ignore relative VITE_API_URL in production builds
66130d8  fix: wire real JWT auth to signin/signup pages
35495d7  remove: all mock data; wire frontend to real API; compute Youth Index
2b54563  (message truncated)
2f353f5  add: Cloudflare Pages deployment setup with Wrangler
360bea6  add: full AI intelligence layer with tool use, rich NLQ, and country AI chat
5769d8a  fix: seed users and experts endpoints
65a0623  add: one-time seed endpoint for production database
a815aec  add: missing type declarations for express, passport, multer
876f4dd  remove: prebuild prisma generate
d7393fe  pin: Prisma to v5.22.0
ef5397c  make: apps/api standalone for deployment
9ec5f00  fix: all build errors for Render deployment
2ed9718  fix: all TypeScript compilation errors
21b3ade  remove: all pnpm references to fix Railway build
9f012d2  remove: pnpm workspace files to fix Nixpacks build
```

Recent focus: real-API wiring, deployment fixes, Cloudflare setup, AI layer.

---

## 22. Technical debt / things to clean up

- Duplicate root `src/` directory (dead code)
- Prisma version drift (5.19.1 root vs 5.22.0 api) — document why or align
- Electron deps in root `package.json` — remove unless desktop is back on
- Mock data in two components
- `RlsMiddleware` stub
- `TODO/FIXME/HACK` comments scattered across ~77 files
- Placeholder insights line in `dashboard.ts:618`
- No CI/CD — no guardrails against regressions
- No `.env.example` for `apps/web` (only root has one)

---

## 23. Things that didn't work (historical)

- **pnpm + Nixpacks on Railway** → removed, switched to bun (commits `21b3ade`, `9f012d2`)
- **Relative `VITE_API_URL` in production builds** → production builds now ignore it and use a hardcoded Render URL (commits `ac83c6d`, `4b2d1cf`)
- **Prisma build-time generation** → removed prebuild step, pinned client to 5.22.0 for reliable Render builds (commits `876f4dd`, `d7393fe`)
- **Shared pnpm workspace with `apps/api`** → `apps/api` was made standalone for deployment (commit `ef5397c`)
- **Multiple rounds of TypeScript build errors** on Render — resolved across `2ed9718`, `9ec5f00`, `a815aec`
- **Mock data everywhere in early builds** — removed in `35495d7`, but two spots survived (see §15)

---

## 24. One-sentence answer to "what is this right now?"

**A mostly-built, demo-ready data intelligence platform for African youth development — solid backend, good frontend, real AI chat, zero automated tests, a handful of production-hardening items remaining before it's fundable as "software" in a serious sense.**

---

_If you're a collaborator picking this up cold: read §2, §5, §6, §13, §14, §15 in that order. Then check `README.md` for setup, `TESTING.md` for what to click, and `/api/docs` in the running backend for API shape._
