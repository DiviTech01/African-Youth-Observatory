# Contributor Upload Pathways — Setup

This is the central reference for all the ways contributors put real data into the platform. Each pathway has a dedicated parser; the universal upload form picks the right one based on the file you drop.

## Pathway summary

| Pathway | File looks like | Drives | API |
|---|---|---|---|
| **AYIMS template** | `<Country>_AYIMS_Template_v1.xlsx` (sheet "AYIMS Data Template") | `IndicatorValue` rows for 54 indicators × 20 years × 1 country → Explore, Themes, Compare, Youth Index, Country profile | `POST /api/data-upload/ayims-template` |
| **Policies database** | `*Polic*Database*.csv` / `.xlsx` (header row with `Country` + the 30 policy columns) | `CountryPolicy` rows scored 0–1 per the AYC Composite Policy Index → Policy Monitor, country profile policy section | `POST /api/data-upload/policies-database` |
| **PKPB report** | PDF (with optional structured form) | `Document(type=PKPB_REPORT)` + `extractedSummary` JSON → `/dashboard/pkpb/<country>` country report card and PDF download | `POST /api/documents` |
| **General document** | PDF/DOCX/PPTX | `Document` with country/source/year metadata → Reports & Files | `POST /api/documents` |
| **Generic indicator CSV** | Long-format CSV with country column + indicator columns | `IndicatorValue` rows after manual column mapping | `POST /api/data-upload/file` |

All pathways converge on the same Contributor Hub at `/dashboard/data-upload`. The contributor drops a file; classifier picks the pipeline; each pipeline has a focused preview + commit.

---

## 1. AYIMS Data Entry Template

**What it does**: drops 54 indicator columns × 20 years (2006–2025) of one country into `IndicatorValue` rows, with gender and age-group splits where the column has them.

**Files involved**:
- `apps/api/src/modules/data-upload/ayims-template-mapping.json` — maps each AYIMS column header to AYD `Indicator.slug` + gender + ageGroup + transform
- `apps/api/src/modules/data-upload/data-upload.service.ts` → `uploadAyimsTemplate()`, helpers `inferCountryFromFilename`, `inferCountryFromMetadata`
- `src/components/upload/AyimsFlow.tsx` — frontend preview + commit UI

**Country detection**: filename prefix → row-1 metadata fallback → contributor override dropdown.

**Setup steps**:
1. Run `pnpm db:seed` after pulling — adds ~30 new indicator slugs (`total-population`, `youth-population-15-35`, `youth-rural-share`, `education-budget-share-gdp`, etc.) and 3 new themes (`peace-security`, `access-to-justice`, `demographics`).
2. Drop a file like `Angola_AYIMS_Template_v1.xlsx` in the Contributor Hub. The form auto-routes to the AYIMS flow.
3. Confirm source attribution → click "Parse template" → review preview → click "Commit".

**Editing the mapping**: open `ayims-template-mapping.json` to add/skip/remap columns. Three new countries' AYIMS templates? Drop them; the same mapping handles all 54 countries.

---

## 2. African National Youth Policies Database

**What it does**: parses one row per country × 30 policy instruments, scores each cell using the AYC Composite Policy Index rules (status × recency, with legal-marker bonus), upserts into `CountryPolicy`.

**Files involved**:
- `apps/api/src/modules/data-upload/policies-database-config.json` — 30 policy columns + dimensions + scoring rules
- `apps/api/src/modules/data-upload/data-upload.service.ts` → `uploadPoliciesDatabase()`, `commitPoliciesJob()`, helpers `isDraftMarker`, `hasLegalAnchor`, `extractLatestYear`, `recencyFactorFor`
- `src/components/upload/PolicyFlow.tsx` — frontend preview + commit UI

**Scoring** (per the AYC scorecard spec):
- Missing/blank → 0
- Draft markers ("in development", "pending", "draft", "en cours d'élaboration", …) → 0.5
- Otherwise → 1
- +0.1 if cell text contains a legal marker (Act, Law, Loi, Code, Constitution, Décret, etc.), capped at 1.0
- × recency factor: 1.0 if year ≥ 2022, 0.8 if 2018–21, 0.6 if 2014–17, 0.4 if 2010–13, 0.2 if pre-2010, 0.5 if no year

**Setup steps**:
- No additional seed needed; uses existing `CountryPolicy` table.
- Drop a file like `African_National_Youth_Policies_Database_v3.csv`. The form auto-routes to the policy flow.

**Notes**:
- Existing AYC ratification flags (`aycRatified`, `wpayCompliant`, etc.) are *preserved* — the policy upsert keys on `(countryId, policyType)` and only updates `policyName`, `yearAdopted`, `complianceScore`, and `status`.
- The composite per-dimension scores (Governance_Participation, Economic_Inclusion, etc.) are computed at query time on the API side, not stored — that's already how `/policy-monitor` works.

---

## 3. PKPB report (PDF + guided form)

**What it does**: stores a Promise Kept · Promise Broken PDF in R2 and a structured summary in `Document.extractedSummary`. The country PKPB page renders the report card from this summary, and the Download button serves the original PDF.

**Files involved**:
- `apps/api/src/modules/documents/` — module
- `src/components/upload/PkpbGuidedForm.tsx` — guided form (replaces the old JSON paste)
- `src/pages/PromiseKeptBrokenCountry.tsx` — country PKPB page
- `src/pages/PromiseKeptBrokenIndex.tsx` — country grid

**Setup steps**:
- R2 already configured (it's reused from the CMS). See env var section below.
- Click "Fill out report-card content" inside the document upload form for the guided UI — every field has a one-line hint.

---

## 4. General documents

Already covered in earlier setup notes. Drop a PDF/DOCX/PPTX, pick a type (PKPB / Country Report / Policy Document / Research Paper / Other), pick a country if relevant. Lands in `Document` table; visible from Reports & Files (`/dashboard/contributor/reports`) and the public Reports page.

---

## 5. Generic indicator CSV

Long-format file with a country column + one column per indicator. Used when you have data that doesn't match the AYIMS shape. Manual column mapping happens in the preview step.

---

## Database migration checklist

```bash
pnpm db:generate           # regenerates Prisma client
pnpm db:push               # syncs the new Document model + new themes/indicators
pnpm db:seed               # populates new indicators + themes
```

If you use migrations: `cd packages/database && npx prisma migrate dev --name contributor_upload_pathways`.

## Cloudflare R2 env vars

Same as before:

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=ayd-cms
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

Documents are stored under `documents/{type}/{countryId?}/{date}/{uuid}.ext` (separate from CMS images). Streamed through the API at `GET /api/documents/:id/download` — bucket does **not** need to be public.

## Sidebar entries (contributor + admin)

Both roles see the same Contributor section:

- **Contributor Hub** → `/dashboard/data-upload` — universal upload form
- **Reports & Files** → `/dashboard/contributor/reports` — browse uploads
- **Promise Kept · Promise Broken** → `/dashboard/pkpb` — country grid

Admins also keep their existing Administration section; both Reports & Files entries (legacy localStorage CMS one + new R2-backed one) coexist.

---

# PKPB & Document Uploads — Setup (legacy section, archived for reference)

This adds three things to the contributor workflow:

1. A smart upload form that auto-routes by file type — CSV/XLSX → indicator data, PDF/DOCX → report/document store.
2. A `Document` table + R2-backed object storage for binary files.
3. A `/pkpb/:countryRef` page that mirrors the Nigeria report card, populated by uploaded PKPB reports.

Below is everything you need to do once before contributors can start uploading.

## 1. Run the database migration

The `Document` model and `DocumentType` / `DocumentStatus` enums are new in `packages/database/prisma/schema.prisma`.

```bash
# from repo root
pnpm db:generate           # regenerates Prisma client
pnpm db:push               # or: pnpm db:migrate (creates a real migration)
```

If you use migrations rather than `db:push`:

```bash
cd packages/database
npx prisma migrate dev --name add_document_model
```

## 2. Configure Cloudflare R2

R2 was already used for CMS image uploads. For documents we reuse the same bucket and credentials. The relevant env vars (already in `.env.example`):

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=ayd-cms
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

Notes:

- Documents are stored under `documents/{type}/{countryId?}/{date}/{uuid}.ext` so they don't collide with the CMS images at `cms/...`.
- Documents are served via the API at `GET /api/documents/:id/download` (server-side proxy, private cache control). `R2_PUBLIC_URL` is only used for CMS images, not documents — you do **not** need to make the bucket publicly readable.

If you want a separate bucket for documents, add `R2_DOCUMENTS_BUCKET` and parametrize `R2Service` — currently it uses one bucket for both.

## 3. Install dependencies

The API picks up two new deps:

```bash
cd apps/api
pnpm install   # or npm install
```

This adds:
- `pdf-parse` (best-effort PDF text extraction on PKPB upload)
- `@types/pdf-parse`

The S3 client (`@aws-sdk/client-s3`) was already installed for the CMS R2 service.

The seed script also uses `@aws-sdk/client-s3` from the root, so install at the root too if you plan to run `pnpm seed:pkpb-nigeria`:

```bash
# at repo root
pnpm install
```

## 4. (Optional) Seed the Nigeria PKPB record

The Nigeria `/pkpb/nigeria` page already renders fully via the hardcoded data in `src/data/countryReports.ts` (parametric fallback). If you want a real DB record for Nigeria too — so the "Download Report Card" button serves the actual `public/reports/Nigeria.html` from R2 instead of opening the static file — run:

```bash
pnpm seed:pkpb-nigeria
```

Re-running is idempotent: it deletes any prior `source = "PACSDA (seed)"` Nigeria PKPB document and recreates it.

## 5. Verify

Once the API is running:

1. Sign in as a CONTRIBUTOR or ADMIN user.
2. Go to `/dashboard/data-upload`.
3. Drop a PDF — the form should auto-detect it and switch into the "Document details" view.
4. For a PKPB upload, pick a country and submit. The success card will link to `/dashboard/pkpb/<country-slug>`.
5. The PKPB country page renders the country report card and "Download Report Card" pulls the original PDF through the API.

Swagger docs: `GET /api/docs` — look for the **documents** tag.

## What's where

| Concern | Location |
|---|---|
| Schema | `packages/database/prisma/schema.prisma` (model `Document`) |
| API module | `apps/api/src/modules/documents/` |
| R2 (extended) | `apps/api/src/modules/content/r2.service.ts` (added `uploadFile`, `getObject`, `deleteObject`) |
| Contributor Hub (upload) | `src/pages/DataUpload.tsx` (universal dropzone routes by file type) |
| Reports & Files (browse) | `src/pages/ContributorReports.tsx` |
| PKPB index (country grid) | `src/pages/PromiseKeptBrokenIndex.tsx` |
| PKPB country page | `src/pages/PromiseKeptBrokenCountry.tsx` |
| Sidebar | `src/layouts/DashboardLayout.tsx` (`contributorLinks`) |
| Routes | `src/App.tsx` — `/pkpb`, `/pkpb/:countryRef`, `/dashboard/contributor/reports` |
| Seed | `scripts/seed-pkpb-nigeria.ts` |

## Contributor sidebar entries

Once a user has the `CONTRIBUTOR` role, they see three links under the Contributor section:

- **Contributor Hub** → `/dashboard/data-upload` — universal upload form (CSV/XLSX → indicators, PDF/DOCX → reports/documents).
- **Reports & Files** → `/dashboard/contributor/reports` — browse all uploaded documents, filter by type, download, delete (admin only).
- **Promise Kept · Promise Broken** → `/dashboard/pkpb` — country grid showing all 54 African countries with PKPB upload status. Click a country to view its full report card.

## Endpoints

```
POST   /api/documents                       (CONTRIBUTOR, ADMIN)  — upload a file
GET    /api/documents                       (public)              — list
GET    /api/documents/:id                   (public)              — single doc
GET    /api/documents/:id/download          (public)              — stream original
GET    /api/documents/by-country/:ref/pkpb  (public)              — latest PKPB for country
DELETE /api/documents/:id                   (ADMIN)               — delete + R2 cleanup
```

`countryRef` accepts country id, ISO3, ISO2, or country name.

## Notes / known limitations

- PDF text extraction (`pdf-parse`) is best-effort and runs in-process. For large PDFs it can be slow; we cap stored text at ~200KB. If extraction fails, the upload still succeeds with `extractedText = null`.
- The `extractedSummary` JSON shape lives in `apps/api/src/modules/documents/documents.dto.ts` (`PkpbExtractedSummary`). It mirrors the `CountryReport` interface used by `CountryReportCard`. Contributors can paste this JSON in the upload form to populate the report card directly; otherwise we fall back to the parametric defaults from `src/data/countryReports.ts`.
- Documents up to **25 MB** are accepted. Bump the `FileInterceptor` limit in `documents.controller.ts` if you need larger.
- HTTP downloads are streamed through the API (private). If you want public, signed CDN URLs, add `@aws-sdk/s3-request-presigner` and switch `getDownloadStream` to `getSignedUrl`.
