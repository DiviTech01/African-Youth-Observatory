# AYD Platform — Final Testing Checklist

Go through each section in order. Check the box when verified. Fix any issues before moving to the next item.

---

## Prerequisites

```bash
# Terminal 1: Database
docker compose up -d

# Terminal 2: Backend
cd apps/api && pnpm dev

# Terminal 3: Frontend
npm run dev
```

Verify services are running:
- [ ] `http://localhost:3001/api/health` returns `{ status: "ok" }`
- [ ] `http://localhost:3001/api/platform/stats` returns real data counts
- [ ] `http://localhost:8080` loads the homepage

---

## 1. Homepage

- [ ] Homepage loads without console errors
- [ ] Quick stats show real numbers (not 0 or NaN)
- [ ] Hero section text is visible (not disappearing)
- [ ] Navigation links all work
- [ ] Language switcher works (EN/FR/AR/PT/SW)
- [ ] Featured data section renders
- [ ] Partners section renders

## 2. Countries

- [ ] `/countries` loads country cards with real data from API
- [ ] Search filters countries by name
- [ ] Region tabs filter correctly (North/West/Central/East/Southern)
- [ ] Country cards show flags, capital, languages
- [ ] Clicking a country opens the country profile
- [ ] Country profile loads with real data
- [ ] Back button returns to country list

## 3. Youth Index

- [ ] `/youth-index` loads ranking table with real scores
- [ ] Top 3 countries display in featured cards with scores
- [ ] Table is sortable by clicking column headers
- [ ] Tier badges show correct colors (green = High, amber = Medium, red = Low)
- [ ] Clicking a row shows radar chart with dimensional breakdown
- [ ] Year selector changes displayed data
- [ ] Scores look reasonable (top countries 60-85, bottom 15-35)

## 4. Data Explorer

- [ ] `/explore` loads the Africa map component
- [ ] Filter sidebar has working dropdowns (country, theme, indicator, year)
- [ ] Selecting an indicator updates visualizations
- [ ] Charts render when filters are applied

## 5. Compare

- [ ] `/compare` page loads
- [ ] Country comparison component renders

## 6. Insights

- [ ] `/insights` shows insight cards (AI or rule-based)
- [ ] Cards display type badges (trend/anomaly/recommendation)
- [ ] Severity badges show correct colors
- [ ] Country filter works (if present)

## 7. Natural Language Query (Ask)

- [ ] `/ask` shows the search interface with example queries
- [ ] Typing a question and submitting gets a response
- [ ] Typing animation works on the answer
- [ ] Chart visualization renders alongside answer
- [ ] Follow-up question suggestions appear
- [ ] Example query buttons work

## 8. Policy Monitor

- [ ] `/policy-monitor` shows compliance ranking table
- [ ] Summary cards show ratified count, avg score, WPAY alignment
- [ ] Table rows show country flags and compliance scores
- [ ] Color coding works (green >70%, amber 50-70%, red <50%)
- [ ] Expandable rows show detail (if applicable)

## 9. Experts

- [ ] `/experts` shows expert cards with real or mock data
- [ ] Search by name/organization works
- [ ] Filter by country works
- [ ] Filter by specialization works
- [ ] "Register as Expert" dialog opens
- [ ] Form can be submitted

## 10. Authentication

- [ ] `/auth/signin` page loads
- [ ] Sign in with `admin@africanyouthdatabase.org` / `AYD@Admin2026!` works
- [ ] After sign in: Navbar shows user avatar/name
- [ ] `/auth/signup` — Create a new account works
- [ ] Sign out clears the session and redirects
- [ ] Contributor sign in: `data@africanyouthdatabase.org` / `AYD@Data2026!`

## 11. Dashboard

- [ ] `/dashboard` loads (may require auth)
- [ ] Dashboard overview shows widgets or welcome message
- [ ] Add widget button works (if implemented)

## 12. Export

- [ ] Export functionality is accessible
- [ ] CSV export downloads a real file
- [ ] JSON export downloads a real file
- [ ] Excel export downloads a real file
- [ ] Downloaded files contain real data columns

## 13. Search

- [ ] Navbar search input appears when clicking search icon
- [ ] Typing 2+ characters triggers search results dropdown
- [ ] Results are grouped by type (countries, indicators, themes, experts)
- [ ] Clicking a result navigates to the correct page
- [ ] Closing search clears results

## 14. Admin

- [ ] `/admin` accessible when logged in as admin
- [ ] Platform stats cards show real numbers
- [ ] Recent activity feed renders
- [ ] Quick action buttons are clickable
- [ ] Clear cache button works (check network tab)

## 15. Data Upload (Contributor)

- [ ] `/dashboard/data-upload` accessible for CONTRIBUTOR and ADMIN roles
- [ ] Upload tab shows drag-and-drop zone
- [ ] Templates tab lists downloadable CSV templates
- [ ] What's Needed tab shows data gaps
- [ ] History tab shows past uploads (or empty state)
- [ ] Sidebar has "Upload Data" link

## 16. Other Pages

- [ ] `/about` loads
- [ ] `/contact` loads
- [ ] `/themes` loads with 9 theme cards
- [ ] `/reports` loads
- [ ] `/resources/faq` loads
- [ ] `/resources/methodology` loads
- [ ] `/resources/glossary` loads
- [ ] `/landing` loads with animations
- [ ] `/settings` loads
- [ ] Invalid route shows 404 page

## 17. API Endpoints (Swagger)

- [ ] `http://localhost:3001/api/docs` loads Swagger UI
- [ ] All 19+ tags visible in sidebar
- [ ] Can execute GET /api/countries and see results
- [ ] Can execute GET /api/youth-index/rankings and see results
- [ ] Bearer auth works in Swagger (paste admin token)

## 18. Responsive Design

- [ ] Homepage looks good on mobile (375px width)
- [ ] Navbar collapses to hamburger menu on mobile
- [ ] Country cards grid adapts (2 cols mobile, 5 cols desktop)
- [ ] Youth Index table scrolls horizontally on mobile
- [ ] Dashboard sidebar collapses on mobile

## 19. Cross-Browser

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari (if available)
- [ ] Works in Edge

---

## Common Issues & Fixes

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Page shows loading forever | API call failing silently | Check browser Network tab for failed requests |
| `TypeError: Cannot read properties of undefined` | API response shape mismatch | Check the data mapping in the component |
| `Failed to fetch` | CORS or API not running | Verify backend is running, check Vite proxy |
| `401 Unauthorized` | Token expired/missing | Sign out and sign back in |
| `BigInt serialization error` | Prisma BigInt for population | Ensure `Number(c.population)` in service |
| Charts empty | Wrong field names for Recharts | Log the data, verify field names match |
| Mock data showing instead of API | API call failed, fallback active | Check console for API errors |

---

## Production Deployment Checklist

- [ ] Frontend deployed to Cloudflare Pages / Vercel / Netlify
- [ ] Backend deployed to Railway / Render / Fly.io
- [ ] PostgreSQL provisioned on Neon / Supabase / Railway
- [ ] Environment variables set (DATABASE_URL, JWT_SECRET, CORS_ORIGIN)
- [ ] Prisma schema pushed to production DB
- [ ] Seed data loaded (countries, themes, indicators, policies, experts)
- [ ] World Bank data imported
- [ ] Youth Index computed
- [ ] Policy compliance computed
- [ ] Admin password changed from default
- [ ] HTTPS working
- [ ] Custom domain configured
- [ ] Production smoke test passed (repeat sections 1-16 above)

---

**Admin Credentials (dev only — change in production):**
- Admin: `admin@africanyouthdatabase.org` / `AYD@Admin2026!`
- Contributor: `data@africanyouthdatabase.org` / `AYD@Data2026!`
