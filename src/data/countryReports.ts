// Country Report Card data — Promise Kept · Promise Broken framework
// Nigeria has full real data transcribed from the PACSDA report (Dec 2025).
// Other 53 countries are generated parametrically from a country profile +
// AYEMI score. Mock data is deterministic per country (seeded) so the same
// page shows the same numbers across reloads.

export type AyemiTier = 'Critical' | 'Developing' | 'Fulfilling';
export type IndicatorSeverity = 'red' | 'gold' | 'green' | 'navy';
export type IndicatorTrend = 'up-good' | 'up-bad' | 'down-good' | 'down-bad' | 'flat';
export type LegStatus = 'active' | 'partial' | 'weak' | 'new';

export interface PromiseItem { title: string; desc: string; stat: string; }
export interface Indicator {
  topic: string;
  value: string;
  label: string;
  compare: string;
  trend: IndicatorTrend;
  severity: IndicatorSeverity;
  barPct: number;
}
export interface Legislation { name: string; year: string; status: LegStatus; reality: string; }
export interface Recommendation { num: string; title: string; desc: string; }

export interface CountryReport {
  country: string;
  slug: string;
  iso3: string;
  region: string;
  edition: string;
  reviewedDate: string;
  nextReview: string;

  // Cover headline
  ayemiScore: number;
  ayemiTier: AyemiTier;
  totalYouthMillions: number;
  totalPopMillions: number;
  medianAge: number;
  youthBulgePct: number;
  globalYouthDevRank: number;
  globalYouthDevTotal: number;
  multidimPovertyPct: number;
  projectedYouth2050M: number;

  // Demographics bars
  popUnder15Pct: number;
  urbanPopPct: number;
  ruralPovertyPct: number;
  ruralAccessLimited: number;

  // Poverty
  overallPovertyPct: number;
  belowNatPovertyPct: number;
  foodInsecurityPct: number;
  informalEmploymentPct: number;
  povertyInsight: string;

  // Narrative
  executiveBrief: string;
  pullQuote: string;
  postQuote: string;

  // Promise items
  promiseKept: PromiseItem[];
  promiseBroken: PromiseItem[];

  // Indicators
  indicators: Indicator[];

  // Governance
  parliamentSeats: number;
  youthSeats: number;
  pressFreedomRank: number;
  pressFreedomTotal: number;
  voterRegYouthPct: number;
  totalVoterYouthPct: number;
  candidatesYouthPct: number;
  civicDigEngagement: number;
  govNarrative: string;

  // Health
  hivYouthSharePct: number;
  mentalHealthBurdenPct: number;
  childMarriageAge: number;
  artCount: string;
  hivWomen: string;
  unmetContraceptionPct: number;
  hivTestGirlsPct: number;
  hivTestBoysPct: number;
  childRightsActStates: string;

  // Education
  literacyPct: number;
  tertiaryGerPct: number;
  internetAccessPct: number;
  brainDrainPct: number;
  passportPct: number;
  bilateralDegreeAgrs: number;
  secondaryCompletionPct: number;

  // Digital ID
  digitalIdMillions: number;
  digitalIdTargetMillions: number;
  bankedMillions: number;
  bankedPct: number;
  noFormalIdPct: number;
  ndpaYear: number;

  // Legislation & Recs
  legislation: Legislation[];
  recommendations: Recommendation[];
}

// ─── Country meta map (region, iso3, capital is from elsewhere) ───
// Region matches the Youth Index data file.
const COUNTRY_META: Record<string, { iso3: string; region: string; popM: number; medianAge: number; parliamentSeats: number }> = {
  Algeria: { iso3: 'DZA', region: 'North Africa', popM: 45.6, medianAge: 28.5, parliamentSeats: 407 },
  Angola: { iso3: 'AGO', region: 'Central Africa', popM: 35.6, medianAge: 16.7, parliamentSeats: 220 },
  Benin: { iso3: 'BEN', region: 'West Africa', popM: 13.4, medianAge: 18.4, parliamentSeats: 109 },
  Botswana: { iso3: 'BWA', region: 'Southern Africa', popM: 2.7, medianAge: 25.7, parliamentSeats: 63 },
  'Burkina Faso': { iso3: 'BFA', region: 'West Africa', popM: 23.3, medianAge: 17.9, parliamentSeats: 71 },
  Burundi: { iso3: 'BDI', region: 'East Africa', popM: 13.4, medianAge: 17.3, parliamentSeats: 123 },
  Cameroon: { iso3: 'CMR', region: 'Central Africa', popM: 28.6, medianAge: 18.7, parliamentSeats: 180 },
  'Cape Verde': { iso3: 'CPV', region: 'West Africa', popM: 0.6, medianAge: 28.5, parliamentSeats: 72 },
  'Central African Republic': { iso3: 'CAF', region: 'Central Africa', popM: 5.6, medianAge: 17.5, parliamentSeats: 140 },
  Chad: { iso3: 'TCD', region: 'Central Africa', popM: 18.3, medianAge: 16.6, parliamentSeats: 188 },
  Comoros: { iso3: 'COM', region: 'East Africa', popM: 0.9, medianAge: 20.4, parliamentSeats: 33 },
  "Côte d'Ivoire": { iso3: 'CIV', region: 'West Africa', popM: 28.9, medianAge: 18.6, parliamentSeats: 255 },
  'Democratic Republic of the Congo': { iso3: 'COD', region: 'Central Africa', popM: 102.3, medianAge: 16.7, parliamentSeats: 500 },
  Djibouti: { iso3: 'DJI', region: 'East Africa', popM: 1.1, medianAge: 24.6, parliamentSeats: 65 },
  Egypt: { iso3: 'EGY', region: 'North Africa', popM: 113.0, medianAge: 24.6, parliamentSeats: 596 },
  'Equatorial Guinea': { iso3: 'GNQ', region: 'Central Africa', popM: 1.7, medianAge: 22.3, parliamentSeats: 100 },
  Eritrea: { iso3: 'ERI', region: 'East Africa', popM: 3.7, medianAge: 19.5, parliamentSeats: 150 },
  Eswatini: { iso3: 'SWZ', region: 'Southern Africa', popM: 1.2, medianAge: 22.1, parliamentSeats: 73 },
  Ethiopia: { iso3: 'ETH', region: 'East Africa', popM: 126.5, medianAge: 19.2, parliamentSeats: 547 },
  Gabon: { iso3: 'GAB', region: 'Central Africa', popM: 2.4, medianAge: 24.6, parliamentSeats: 143 },
  Gambia: { iso3: 'GMB', region: 'West Africa', popM: 2.7, medianAge: 17.8, parliamentSeats: 58 },
  Ghana: { iso3: 'GHA', region: 'West Africa', popM: 33.5, medianAge: 20.7, parliamentSeats: 275 },
  Guinea: { iso3: 'GIN', region: 'West Africa', popM: 14.0, medianAge: 18.9, parliamentSeats: 114 },
  'Guinea-Bissau': { iso3: 'GNB', region: 'West Africa', popM: 2.1, medianAge: 18.0, parliamentSeats: 102 },
  Kenya: { iso3: 'KEN', region: 'East Africa', popM: 55.1, medianAge: 20.0, parliamentSeats: 350 },
  Lesotho: { iso3: 'LSO', region: 'Southern Africa', popM: 2.3, medianAge: 24.0, parliamentSeats: 120 },
  Liberia: { iso3: 'LBR', region: 'West Africa', popM: 5.4, medianAge: 18.3, parliamentSeats: 73 },
  Libya: { iso3: 'LBY', region: 'North Africa', popM: 7.0, medianAge: 28.7, parliamentSeats: 200 },
  Madagascar: { iso3: 'MDG', region: 'East Africa', popM: 30.3, medianAge: 19.6, parliamentSeats: 151 },
  Malawi: { iso3: 'MWI', region: 'East Africa', popM: 20.9, medianAge: 17.7, parliamentSeats: 193 },
  Mali: { iso3: 'MLI', region: 'West Africa', popM: 23.2, medianAge: 16.4, parliamentSeats: 147 },
  Mauritania: { iso3: 'MRT', region: 'West Africa', popM: 4.9, medianAge: 20.3, parliamentSeats: 157 },
  Mauritius: { iso3: 'MUS', region: 'East Africa', popM: 1.3, medianAge: 37.4, parliamentSeats: 70 },
  Morocco: { iso3: 'MAR', region: 'North Africa', popM: 37.8, medianAge: 29.6, parliamentSeats: 395 },
  Mozambique: { iso3: 'MOZ', region: 'East Africa', popM: 33.9, medianAge: 17.7, parliamentSeats: 250 },
  Namibia: { iso3: 'NAM', region: 'Southern Africa', popM: 2.8, medianAge: 21.8, parliamentSeats: 104 },
  Niger: { iso3: 'NER', region: 'West Africa', popM: 27.2, medianAge: 14.9, parliamentSeats: 166 },
  Nigeria: { iso3: 'NGA', region: 'West Africa', popM: 237.5, medianAge: 18.3, parliamentSeats: 360 },
  'Republic of the Congo': { iso3: 'COG', region: 'Central Africa', popM: 6.1, medianAge: 19.6, parliamentSeats: 151 },
  Rwanda: { iso3: 'RWA', region: 'East Africa', popM: 14.1, medianAge: 19.7, parliamentSeats: 80 },
  'São Tomé and Príncipe': { iso3: 'STP', region: 'Central Africa', popM: 0.23, medianAge: 18.7, parliamentSeats: 55 },
  Senegal: { iso3: 'SEN', region: 'West Africa', popM: 17.7, medianAge: 19.4, parliamentSeats: 165 },
  Seychelles: { iso3: 'SYC', region: 'East Africa', popM: 0.1, medianAge: 35.6, parliamentSeats: 35 },
  'Sierra Leone': { iso3: 'SLE', region: 'West Africa', popM: 8.6, medianAge: 19.2, parliamentSeats: 146 },
  Somalia: { iso3: 'SOM', region: 'East Africa', popM: 17.6, medianAge: 16.7, parliamentSeats: 275 },
  'South Africa': { iso3: 'ZAF', region: 'Southern Africa', popM: 60.4, medianAge: 27.6, parliamentSeats: 400 },
  'South Sudan': { iso3: 'SSD', region: 'East Africa', popM: 11.1, medianAge: 18.6, parliamentSeats: 332 },
  Sudan: { iso3: 'SDN', region: 'North Africa', popM: 47.9, medianAge: 19.7, parliamentSeats: 426 },
  Tanzania: { iso3: 'TZA', region: 'East Africa', popM: 65.5, medianAge: 18.0, parliamentSeats: 393 },
  Togo: { iso3: 'TGO', region: 'West Africa', popM: 8.8, medianAge: 19.4, parliamentSeats: 91 },
  Tunisia: { iso3: 'TUN', region: 'North Africa', popM: 12.0, medianAge: 33.5, parliamentSeats: 161 },
  Uganda: { iso3: 'UGA', region: 'East Africa', popM: 47.2, medianAge: 16.8, parliamentSeats: 529 },
  Zambia: { iso3: 'ZMB', region: 'East Africa', popM: 20.0, medianAge: 17.6, parliamentSeats: 167 },
  Zimbabwe: { iso3: 'ZWE', region: 'East Africa', popM: 16.3, medianAge: 18.7, parliamentSeats: 280 },
};

// ─── AYEMI score per country (0-100). Higher = better youth outcomes. ───
// Roughly tracks the Youth Index ranking from src/pages/YouthIndex.tsx so the
// "Critical / Developing / Fulfilling" tier is internally consistent.
const AYEMI_SCORES: Record<string, number> = {
  Mauritius: 78, Seychelles: 76, Tunisia: 72, Botswana: 71, 'South Africa': 70,
  'Cape Verde': 69, Rwanda: 68, Morocco: 67, Ghana: 66, Kenya: 65,
  Egypt: 64, Namibia: 63, Senegal: 62, Tanzania: 61, Ethiopia: 58,
  Algeria: 57, "Côte d'Ivoire": 56, Gabon: 55, Eswatini: 54, Lesotho: 53,
  Uganda: 52, Zambia: 52, Cameroon: 51, Zimbabwe: 50, Benin: 50,
  'São Tomé and Príncipe': 49, Togo: 49, Madagascar: 48, Mozambique: 47, Comoros: 47,
  Malawi: 46, Djibouti: 45, 'Republic of the Congo': 45, 'Equatorial Guinea': 44, Mauritania: 44,
  Liberia: 43, 'Sierra Leone': 42, Gambia: 42, Angola: 41, Nigeria: 33,
  Burundi: 40, 'Burkina Faso': 39, Niger: 39, Mali: 38, Eritrea: 37,
  Guinea: 37, Sudan: 36, Libya: 35, 'Democratic Republic of the Congo': 35,
  'Guinea-Bissau': 34, Chad: 33, 'Central African Republic': 32, Somalia: 31, 'South Sudan': 30,
};

const tierFor = (s: number): AyemiTier => (s >= 67 ? 'Fulfilling' : s >= 34 ? 'Developing' : 'Critical');

// Deterministic seeded RNG so mock numbers stay stable across reloads.
function seededRand(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10_000) / 10_000;
  };
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ───────────────────────────────────────────────────────────────────
// Nigeria — full real data
// ───────────────────────────────────────────────────────────────────
const NIGERIA: CountryReport = {
  country: 'Nigeria',
  slug: 'nigeria',
  iso3: 'NGA',
  region: 'West Africa',
  edition: 'Updated Edition · Dec 2025',
  reviewedDate: 'March 2026',
  nextReview: 'March 2027',

  ayemiScore: 33,
  ayemiTier: 'Critical',
  totalYouthMillions: 70,
  totalPopMillions: 237.5,
  medianAge: 18.3,
  youthBulgePct: 47,
  globalYouthDevRank: 172,
  globalYouthDevTotal: 183,
  multidimPovertyPct: 67.5,
  projectedYouth2050M: 120,

  popUnder15Pct: 43,
  urbanPopPct: 55.8,
  ruralPovertyPct: 75.5,
  ruralAccessLimited: 75.7,

  overallPovertyPct: 61,
  belowNatPovertyPct: 40.1,
  foodInsecurityPct: 33.2,
  informalEmploymentPct: 92.7,
  povertyInsight:
    'From 40% in 2018/19 to 61% in 2025 — a 21-point deterioration driven by inflation, currency devaluation, and the removal of fuel subsidies. One in three Nigerians is now food insecure.',

  executiveBrief:
    "Nigeria is Africa's most populous nation and its youngest. With a median age of 18.3 years and 47% of adults aged 15–29, the country possesses a demographic weight unmatched on the continent. The question this report asks is blunt: is that weight being converted into human capital, or squandered? The evidence, assembled from NBS, World Bank, UNAIDS, NIMC, Afrobarometer, and PACSDA's AYIMS platform, points to a widening gap between formal commitments and lived reality.",
  pullQuote:
    'Nigeria has signed, ratified, and legislated. What it has not done — consistently, structurally, at scale — is implement. The AYEMI score of 33% has not moved in six years. That is not a policy failure. It is a governance failure.',
  postQuote:
    'This report is structured as a dual audit. Promise Kept enumerates genuine, youth-specific wins — with forensic precision, not generalised praise. Promise Broken names failures, with data. Together, they constitute an accountability framework for the next reporting cycle to measure progress against.',

  promiseKept: [
    { title: 'Age of candidacy reduced — a direct youth political right', desc: 'The Not Too Young to Run Act (2018) lowered presidential candidacy age from 40→35 and House of Reps from 30→25. A statutory right, not merely aspirational. Youth candidates constituted 28.6% of 2023 general election contestants — a legal gateway that did not exist pre-2018.', stat: 'In force since 2018 · 28.6% youth candidates in 2023' },
    { title: 'NIN enrolment: youth identity access expanding', desc: '124 million NINs issued by October 2025 — +10 million in a single year. NIN is the gateway to banking, voting registration, SIM ownership, and tertiary enrolment for young Nigerians. Youth 18–35 represent the dominant registration cohort in 2025 enrolment data.', stat: '124M issued · +10M in 2025 · 84% of 148M target' },
    { title: 'NDPA 2023 — youth data rights legislated', desc: "The Nigeria Data Protection Act 2023 gives young citizens enforceable rights over their digital data — directly relevant to the growing cohort of youth in gig platforms, edtech, fintech, and social media. Nigeria's GCI rank improved in 2024, partly reflecting this reform.", stat: 'NDPA enacted 2023 · GCI rank improving 2024' },
    { title: 'ART scale-up: youth HIV treatment access extended', desc: '931,500 people receiving antiretroviral therapy in CDC-supported states by end-2024. With youth 15–24 accounting for 40% of new infections, this treatment scale-up has direct life-saving impact on the youngest cohort — particularly young women, who bear 1.6% prevalence vs. 1.0% for young men.', stat: '931,500 on ART · CDC 2024 · youth share ~40% of burden' },
    { title: 'Juvenile courts operational in all 36 states', desc: '~1,200 juvenile courts are operational across all 36 states (NJC 2023) — a structural achievement for youth justice. This provides young offenders with a legally distinct adjudication pathway as required under the Child Rights Act and international juvenile justice standards.', stat: '~1,200 courts · 36 states · NJC 2023' },
    { title: '12 bilateral degree equivalence agreements secured', desc: 'Nigeria has concluded 12 bilateral degree recognition agreements (MFA 2024), enabling Nigerian graduates — overwhelmingly young people — to have academic qualifications recognised in partner countries. Critical foundation for youth mobility under the AfCFTA Women & Youth Protocol and ECOWAS free movement provisions.', stat: '12 bilateral agreements · MFA 2024' },
    { title: 'Youth electoral surge: 76% of new 2023 voter registrants', desc: 'Young Nigerians aged 18–35 constituted 76% of all newly registered voters ahead of the 2023 general elections — demonstrating formidable civic appetite when access is available. This establishes a democratic mandate that governance structures have yet to reflect proportionally.', stat: '76% of new registrants · 37.7% of total register · INEC 2023' },
  ],
  promiseBroken: [
    { title: 'AYEMI score frozen at 33% for six consecutive years', desc: "Despite ratification of the Africa Youth Charter (AYC) in 2009, the 2019 National Youth Policy, and a new administration in 2023, Nigeria's composite youth empowerment index has not advanced a single percentage point since the 2019 baseline. Updated 2025 data shows net regression in poverty, literacy, and political representation.", stat: '0% improvement · 2019–2025 · regression in multiple sub-scores' },
    { title: '61% in poverty — 21-point surge since 2018/19', desc: 'Youth multidimensional poverty stands at 67.5%; 40.1% of youth fall below the national poverty line (FAO 2022). Food insecurity is moderate-to-severe for 33.2% of the population. The removal of fuel subsidies, naira devaluation, and inflation without compensatory youth safety nets drove this historic reversal.', stat: '61% overall · 67.5% youth MPI · 33.2% food insecure' },
    { title: 'Functional literacy only 62% among youth 15–35', desc: "Functional literacy for youth aged 15–35 stands at 62% (NBS/NMCS). Tertiary GER is a dismal 11.9% — one of the lowest in West Africa. Only 11% of youth 15–35 have internet access (provisional NBS/NCC). These three figures together reveal an education infrastructure failing to produce the human capital Nigeria's demographic dividend requires.", stat: '62% literacy · 11.9% tertiary GER · ~11% internet access (youth)' },
    { title: 'Brain drain: ~3.2% net youth emigration per year', desc: 'An estimated 3.2% net emigration rate (IOM) among youth reflects structural failure. Only 18% of Nigerians hold a passport (NBS 2022) — meaning the emigration burden falls almost entirely on the educated, skilled, and opportunity-seeking youth. With ~29/100K civic digital engagement, the next-generation advocates are leaving.', stat: '~3.2% net emigration · passport coverage only 18%' },
    { title: 'Female youth unemployment: 41.7% — structurally ignored', desc: 'Female youth unemployment stands at 41.7% — more than 6x the official 6.5% headline rate and almost entirely invisible in policy responses. The gender employment gap is compounded by a NEET rate that disproportionately affects young women in the north, where rural access limitations reach 75.7%.', stat: '41.7% female youth unemployment · NEET gender gap unaddressed' },
    { title: 'Only 3.92% of House seats held by youth — NTYTYR unfulfilled', desc: '14 of 360 House seats. Youth candidates fell from 34% in 2019 to 28.6% in 2023. High nomination fees and party godfatherism structurally exclude youth. Civic digital engagement of ~29/100K reflects a generation tuned out of formal channels. Press freedom at RSF rank 112/180 further constrains youth civic voice.', stat: '3.92% seats · RSF rank 112/180 · civic digital engagement ~29/100K' },
    { title: 'Youth mental health crisis: 33.2% affected — no national programme', desc: '33.2% of youth present with moderate-to-severe mental health indicators (FAO FES 2023). No dedicated youth mental health programme exists at federal level. Child marriage age stands at 20.2 years (NBS 2019 adult module youth cohort interpolation) — indicating a persistent pattern of early forced union disproportionately affecting girls.', stat: '33.2% mental health burden · child marriage age 20.2 · no federal programme' },
  ],

  indicators: [
    { topic: 'Youth Poverty', value: '67.5%', label: 'Youth 15–35 in multidimensional poverty (NBS MPI 2022)', compare: 'Was ~40% in 2018/19 — worst cohort nationally', trend: 'up-bad', severity: 'red', barPct: 67.5 },
    { topic: 'Female Unemployment', value: '41.7%', label: 'Female youth unemployment (legacy-comparable methodology)', compare: 'vs. 6.5% official headline — gender gap structurally unaddressed', trend: 'up-bad', severity: 'red', barPct: 41.7 },
    { topic: 'Informality', value: '92.7%', label: 'All workers in informal employment (NBS Q2 2023)', compare: 'Minimum wage benefit reaches <8% of youth workers', trend: 'up-bad', severity: 'gold', barPct: 92.7 },
    { topic: 'Literacy', value: '62%', label: 'Functional literacy, youth 15–35 (NBS/NMCS)', compare: '38% of Nigerian youth functionally illiterate', trend: 'down-bad', severity: 'navy', barPct: 62 },
    { topic: 'Tertiary GER', value: '11.9%', label: 'Tertiary Gross Enrolment Ratio (NBS/NMCS)', compare: 'Among the lowest in West Africa — SDG 4 severely off-track', trend: 'down-bad', severity: 'red', barPct: 11.9 },
    { topic: 'Internet Access', value: '~11%', label: 'Youth 15–35 with internet access (NBS/NCC provisional)', compare: 'Digital exclusion compounds education and employment gaps', trend: 'down-bad', severity: 'red', barPct: 11 },
    { topic: 'Political Seats', value: '3.92%', label: 'House of Reps seats held by youth 25–35 (2023 elections)', compare: '14 of 360 — despite 76% of new voters being youth', trend: 'down-bad', severity: 'red', barPct: 3.92 },
    { topic: 'Digital Identity', value: '124M', label: 'NINs issued (NIMC Oct 2025) — +10M in 2025 alone', compare: '84% toward World Bank 148M target by 2026', trend: 'up-good', severity: 'green', barPct: 84 },
    { topic: 'Brain Drain', value: '~3.2%', label: 'Net youth emigration rate per year (IOM estimate)', compare: 'Only 18% hold passports — loss concentrated among skilled youth', trend: 'up-bad', severity: 'gold', barPct: 32 },
    { topic: 'GYDI Rank', value: '172/183', label: 'Global Youth Development Index (Commonwealth 2023)', compare: '2nd lowest globally — worst in West Africa', trend: 'down-bad', severity: 'red', barPct: 94 },
    { topic: 'HIV Youth Share', value: '40%', label: 'New HIV infections in youth 15–24 (NACA)', compare: 'Only 13% of girls 15–19 tested in past year', trend: 'up-bad', severity: 'red', barPct: 40 },
    { topic: 'Mental Health', value: '33.2%', label: 'Youth with moderate–severe mental health indicators (FAO FES 2023)', compare: 'No dedicated federal youth mental health programme exists', trend: 'up-bad', severity: 'gold', barPct: 33.2 },
  ],

  parliamentSeats: 360,
  youthSeats: 14,
  pressFreedomRank: 112,
  pressFreedomTotal: 180,
  voterRegYouthPct: 76,
  totalVoterYouthPct: 37.7,
  candidatesYouthPct: 28.6,
  civicDigEngagement: 29,
  govNarrative:
    "Young Nigerians delivered the most energetic voter registration surge in Nigeria's democratic history — yet occupy less than 4% of parliament. The data expose a system that harvests youth electoral energy while systematically blocking youth governance access.",

  hivYouthSharePct: 40,
  mentalHealthBurdenPct: 33.2,
  childMarriageAge: 20.2,
  artCount: '931K',
  hivWomen: '14,000',
  unmetContraceptionPct: 53,
  hivTestGirlsPct: 13,
  hivTestBoysPct: 9,
  childRightsActStates: '24/36',

  literacyPct: 62,
  tertiaryGerPct: 11.9,
  internetAccessPct: 11,
  brainDrainPct: 3.2,
  passportPct: 18,
  bilateralDegreeAgrs: 12,
  secondaryCompletionPct: 44,

  digitalIdMillions: 124,
  digitalIdTargetMillions: 148,
  bankedMillions: 67.8,
  bankedPct: 28,
  noFormalIdPct: 50,
  ndpaYear: 2023,

  legislation: [
    { name: 'Not Too Young to Run Act', year: '2018', status: 'partial', reality: 'Age barriers reduced but nomination fee barriers (~₦100M+) effectively exclude most youth. Seats held: 3.92% HoR. Youth candidates trending down (34%→28.6%).' },
    { name: 'Nigeria Data Protection Act (NDPA)', year: '2023', status: 'active', reality: "Youth-positive: enforceable digital rights for Nigeria's gig, fintech, and social platform cohort. GCI rank improving. Compliance economy creates youth employment pathway if trained." },
    { name: 'AfCFTA Women & Youth Protocol', year: 'Active', status: 'partial', reality: 'Nigeria is a signatory. Domestic operationalisation of youth economic participation mechanisms is absent. No dedicated implementation body, budget, or monitoring framework for youth provisions.' },
    { name: 'ECOWAS Free Movement Protocol', year: 'Active', status: 'partial', reality: 'Theoretically enables Nigerian youth intra-regional mobility and labour rights. In practice: 18% passport coverage, no youth-facing mobility facilitation, and inadequate degree recognition infrastructure limit uptake.' },
    { name: 'Africa Youth Charter (AYC) · Ratified', year: '2009', status: 'weak', reality: 'Ratified but addendum enforcement legislation weak. AYEMI score of 33% reflects systemic non-compliance with Africa Youth Charter (AYC) provisions. No annual youth rights status report published to AUC as required.' },
    { name: 'Violence Against Persons (Prohibition) Act', year: '2015', status: 'partial', reality: 'Federal law in place. Many states have not domesticated. GBV rates remain high. Youth women 15–29 are the primary victim cohort yet under-served by reporting and support mechanisms.' },
    { name: 'Child Rights Act', year: '2003', status: 'partial', reality: 'Only 24 of 36 states have domesticated. Child marriage age stands at 20.2 years. Juvenile courts now operational in all 36 states — a genuine achievement under this framework.' },
    { name: 'National Youth Policy', year: '2019–23', status: 'weak', reality: 'Policy expired in 2023. No successor policy in force by end-2025. Youth programme delivery operates without a current statutory framework — a governance gap with no equivalent in peer AU member states.' },
    { name: 'National Youth Investment Fund (NYIF) Phase II', year: '2023–25', status: 'partial', reality: 'Underfunded relative to the scale of need. Collateral requirements and bureaucratic processes exclude the 92.7% informally employed youth for whom the fund is nominally designed.' },
    { name: 'SDGs / AU Agenda 2063 Youth Targets', year: '2015/2063', status: 'weak', reality: 'Severely behind on SDG 1, 4, 8, and 16. No voluntary national review submitted to HLPF since 2017. AU youth engagement targets under Agenda 2063 lack a domestic tracking mechanism.' },
  ],

  recommendations: [
    { num: '01', title: 'Enact a mandatory 30% youth quota for executive appointments', desc: "Constitutionally back a 30% minimum youth representation requirement across all federal and state executive appointments. Without structural requirements, youth inclusion remains at incumbents' discretion." },
    { num: '02', title: 'Cap nomination fees for youth candidates under 35', desc: "Establish a government-subsidised, capped nomination fee structure. The NTYTYR Act's age reforms are nullified by nomination costs running to ₦100M+. Electoral financial inclusion is the missing link." },
    { num: '03', title: 'Launch a National Youth Mental Health Programme', desc: '33.2% of youth carry a moderate-to-severe mental health burden with no federal programme pathway. Commission a time-bound national programme with dedicated funding, community health worker training, and school-based intervention infrastructure.' },
    { num: '04', title: 'Operationalise AfCFTA W&Y Protocol youth provisions domestically', desc: "Establish a dedicated interministerial body to implement Nigeria's youth economic participation obligations. Leverage the 12 bilateral degree equivalence agreements as a mobility-and-return framework." },
    { num: '05', title: 'Deploy mobile NIN units to rural areas, IDPs, and women', desc: 'With ~50% of the population still without formal ID, accelerate mobile enrolment to the final mile. The 148M target by 2026 is within reach but requires equity-focused delivery, not urban concentration.' },
    { num: '06', title: 'Enact a new National Youth Policy (2026–2030) with funded mandates', desc: 'The 2019–2023 policy expired with no successor. The new policy must carry funded mandates, not aspirational language.' },
    { num: '07', title: 'NGYouthInfo.ng — Nigeria\'s dedicated youth data platform', desc: "PACSDA's NGYouthInfo.ng platform will serve as Nigeria's centralised, publicly accessible youth information and disaggregated statistics hub — providing gender, age cohort, geopolitical zone, disability status, and urban/rural breakdowns in real time." },
  ],
};

// ───────────────────────────────────────────────────────────────────
// Mock generator for non-Nigeria countries
// ───────────────────────────────────────────────────────────────────
function generateReport(country: string): CountryReport {
  const meta = COUNTRY_META[country];
  if (!meta) throw new Error(`No country meta for ${country}`);
  const score = AYEMI_SCORES[country] ?? 50;
  const tier = tierFor(score);
  const rand = seededRand(country);
  const jitter = (base: number, range: number) => +(base + (rand() * 2 - 1) * range).toFixed(1);

  // Better score → better metrics. Worse score → worse.
  // factor: 0 (terrible) → 1 (great)
  const factor = score / 100;
  const inv = 1 - factor;

  const youthM = +(meta.popM * 0.32).toFixed(1);
  const projected2050M = +(meta.popM * 1.55 * 0.30).toFixed(1);
  const youthBulgePct = jitter(40 + factor * 18, 4);
  const popUnder15Pct = jitter(38 + inv * 12, 3);
  const urbanPopPct = jitter(35 + factor * 35, 6);

  const overallPovertyPct = jitter(20 + inv * 55, 6);
  const youthMpiPct = jitter(overallPovertyPct + 6, 4);
  const belowNatPovertyPct = jitter(overallPovertyPct * 0.65, 4);
  const foodInsecurityPct = jitter(15 + inv * 35, 4);
  const informalEmploymentPct = jitter(55 + inv * 38, 5);
  const ruralPovertyPct = jitter(overallPovertyPct + 12, 5);

  const literacyPct = Math.max(45, Math.min(98, jitter(55 + factor * 40, 5)));
  const tertiaryGerPct = +(jitter(8 + factor * 28, 4)).toFixed(1);
  const internetAccessPct = +(jitter(8 + factor * 65, 6)).toFixed(0);
  const brainDrainPct = +(jitter(0.8 + inv * 3, 0.6)).toFixed(1);
  const passportPct = +(jitter(12 + factor * 50, 5)).toFixed(0);

  const youthSeats = Math.max(2, Math.round(meta.parliamentSeats * (0.025 + factor * 0.10) * (0.85 + rand() * 0.3)));
  const pressFreedomRank = Math.round(jitter(40 + inv * 110, 12));

  const ayemiPct = score;
  const globalYouthDevRank = Math.round(jitter(180 - factor * 170, 10));

  return {
    country,
    slug: slugify(country),
    iso3: meta.iso3,
    region: meta.region,
    edition: 'Updated Edition · Dec 2025',
    reviewedDate: 'March 2026',
    nextReview: 'March 2027',

    ayemiScore: ayemiPct,
    ayemiTier: tier,
    totalYouthMillions: youthM,
    totalPopMillions: meta.popM,
    medianAge: meta.medianAge,
    youthBulgePct,
    globalYouthDevRank,
    globalYouthDevTotal: 183,
    multidimPovertyPct: youthMpiPct,
    projectedYouth2050M: projected2050M,

    popUnder15Pct,
    urbanPopPct,
    ruralPovertyPct,
    ruralAccessLimited: jitter(ruralPovertyPct + 2, 4),

    overallPovertyPct,
    belowNatPovertyPct,
    foodInsecurityPct,
    informalEmploymentPct,
    povertyInsight:
      tier === 'Critical'
        ? `Multidimensional poverty among youth in ${country} stands at ${youthMpiPct}%, well above peer averages. Inflation, currency volatility, and inadequate youth safety nets are compounding the burden.`
        : tier === 'Developing'
          ? `${country}'s youth poverty has plateaued. ${youthMpiPct}% youth multidimensional poverty signals that recent macro stability has not yet translated into household-level gains for the next generation.`
          : `${country}'s youth poverty rate of ${youthMpiPct}% is among the lower bands continentally, but pockets of rural deprivation persist and require targeted intervention.`,

    executiveBrief:
      tier === 'Critical'
        ? `${country} is contending with a youth empowerment crisis. With a median age of ${meta.medianAge} and ~${youthM}M young people aged 15–35, the demographic foundation is substantial — yet the AYEMI score of ${ayemiPct}% places the country in the Critical band. The widening gap between formal commitments under the African Youth Charter and lived outcomes is the central finding of this report.`
        : tier === 'Developing'
          ? `${country} sits in the Developing band of the African Youth Empowerment & Monitoring Index, scoring ${ayemiPct}%. Genuine policy commitments exist but the translation into measurable outcomes for ${youthM}M young people aged 15–35 is uneven. This report audits where the system is delivering, and where it is stalling.`
          : `${country} ranks among the continental leaders in youth empowerment with an AYEMI score of ${ayemiPct}%. The country has converted demographic and policy advantages into measurable outcomes for its ${youthM}M young people. This report identifies what is working and the residual gaps still requiring closure.`,
    pullQuote:
      tier === 'Critical'
        ? `${country} has signed, ratified, and legislated. What it has not done — consistently, structurally, at scale — is implement.`
        : tier === 'Developing'
          ? `${country}'s youth policy architecture exists. The work ahead is execution, accountability, and sub-national equity.`
          : `${country} has demonstrated that intentional, funded youth policy delivers. The challenge now is sustaining momentum and closing remaining gaps.`,
    postQuote:
      'This report is structured as a dual audit. Promise Kept enumerates genuine, youth-specific wins. Promise Broken names failures, with data. Together, they constitute an accountability framework for the next reporting cycle.',

    promiseKept: [
      { title: 'Digital identity enrolment expanding', desc: `${country}'s national ID system has accelerated coverage among youth 18–35, providing the gateway to banking, voting, SIM ownership, and tertiary enrolment for a cohort previously excluded.`, stat: 'Identity coverage trending positive · 2024–2025' },
      { title: 'Youth electoral registration outpacing population growth', desc: `Young ${country.includes(' ') ? country : `${country}an`} citizens aged 18–35 represent an outsized share of new voter registrations — establishing a democratic mandate the political system has yet to fully reflect.`, stat: 'Youth share of new registrants trending up' },
      { title: 'Education access extension', desc: `Secondary school completion has improved over the last decade, and tertiary enrolment is expanding from a low base. The pipeline for skilled youth is widening, even where it remains constrained.`, stat: `${literacyPct}% functional literacy · expanding base` },
      { title: 'Health programme scale-up for youth cohort', desc: `Antiretroviral therapy access, adolescent maternal health, and routine immunisation programmes have measurably expanded coverage among the youth cohort, with international donor support.`, stat: 'Donor-supported youth health programmes active' },
      { title: 'Juvenile justice infrastructure operational', desc: `${country} maintains juvenile court infrastructure providing young offenders with a legally distinct adjudication pathway aligned with international juvenile justice standards.`, stat: 'Juvenile court network functional' },
      { title: 'AfCFTA & regional mobility frameworks signed', desc: `${country} is a signatory to the AfCFTA Women & Youth Protocol and regional free-movement frameworks, creating a legal foundation for cross-border youth economic participation.`, stat: 'AfCFTA W&Y signatory · regional protocols active' },
    ],
    promiseBroken: [
      { title: `AYEMI score stagnating at ${ayemiPct}%`, desc: `Despite ratification of the African Youth Charter and successive national youth policies, ${country}'s composite youth empowerment index has not advanced meaningfully. The gap between legal commitment and lived reality is widening.`, stat: `${ayemiPct}% AYEMI · ${tier} band` },
      { title: `${overallPovertyPct.toFixed(0)}% in poverty — youth bear the brunt`, desc: `Overall poverty stands at ${overallPovertyPct.toFixed(0)}%; youth multidimensional poverty is higher at ${youthMpiPct.toFixed(0)}%. ${foodInsecurityPct.toFixed(0)}% face moderate-to-severe food insecurity. The youth cohort is consistently the worst-affected nationally.`, stat: `${overallPovertyPct.toFixed(0)}% overall · ${youthMpiPct.toFixed(0)}% youth MPI` },
      { title: `Tertiary enrolment only ${tertiaryGerPct}% — pipeline crisis`, desc: `With tertiary GER at ${tertiaryGerPct}% and only ${internetAccessPct}% of youth with internet access, the human capital pipeline cannot supply the formal economy at scale. Digital exclusion compounds every other education gap.`, stat: `${tertiaryGerPct}% tertiary · ${internetAccessPct}% internet access` },
      { title: `Brain drain: ~${brainDrainPct}% net youth emigration per year`, desc: `Net youth emigration of ~${brainDrainPct}% reflects structural failure to retain skilled, educated youth. With only ${passportPct}% passport coverage, emigration is concentrated among the most-prepared cohort.`, stat: `~${brainDrainPct}% net emigration · ${passportPct}% passport coverage` },
      { title: 'Female youth unemployment structurally ignored', desc: `Female youth unemployment runs significantly higher than the headline rate. The gender employment gap is a quiet structural failure — invisible in policy responses despite its scale.`, stat: 'Female youth unemployment elevated · NEET gender gap unaddressed' },
      { title: `Youth seats: ~${((youthSeats / meta.parliamentSeats) * 100).toFixed(1)}% of parliament`, desc: `${youthSeats} of ${meta.parliamentSeats} parliamentary seats are held by youth — a share well below the youth proportion of the electorate. High nomination costs and party gatekeeping structurally exclude young candidates.`, stat: `${youthSeats}/${meta.parliamentSeats} seats · RSF rank ${pressFreedomRank}/180` },
      { title: 'Youth mental health: no national programme', desc: `A growing share of young people present with moderate-to-severe mental health indicators. There is no dedicated national youth mental health programme, and community-level support pathways are largely informal.`, stat: 'Mental health burden rising · no dedicated federal programme' },
    ],

    indicators: [
      { topic: 'Youth Poverty', value: `${youthMpiPct.toFixed(1)}%`, label: 'Youth 15–35 in multidimensional poverty', compare: tier === 'Critical' ? 'Worst cohort nationally' : 'Above non-youth average', trend: 'up-bad', severity: youthMpiPct > 50 ? 'red' : 'gold', barPct: youthMpiPct },
      { topic: 'Female Unemployment', value: `${jitter(28 + inv * 18, 4).toFixed(1)}%`, label: 'Female youth unemployment (legacy methodology)', compare: 'Far above headline rate — gender gap structurally unaddressed', trend: 'up-bad', severity: 'red', barPct: jitter(35, 6) },
      { topic: 'Informality', value: `${informalEmploymentPct.toFixed(0)}%`, label: 'Workers in informal employment', compare: 'Minimum wage protections do not reach informal cohort', trend: 'up-bad', severity: 'gold', barPct: informalEmploymentPct },
      { topic: 'Literacy', value: `${literacyPct}%`, label: 'Functional literacy, youth 15–35', compare: `${(100 - literacyPct).toFixed(0)}% functionally illiterate`, trend: 'down-bad', severity: 'navy', barPct: literacyPct },
      { topic: 'Tertiary GER', value: `${tertiaryGerPct}%`, label: 'Tertiary Gross Enrolment Ratio', compare: tier === 'Critical' ? 'SDG 4 severely off-track' : 'Pipeline expanding from low base', trend: 'down-bad', severity: tertiaryGerPct < 15 ? 'red' : 'gold', barPct: tertiaryGerPct },
      { topic: 'Internet Access', value: `${internetAccessPct}%`, label: 'Youth 15–35 with internet access', compare: 'Digital exclusion compounds education and employment gaps', trend: internetAccessPct > 35 ? 'up-good' : 'down-bad', severity: internetAccessPct > 35 ? 'green' : 'red', barPct: internetAccessPct },
      { topic: 'Political Seats', value: `${((youthSeats / meta.parliamentSeats) * 100).toFixed(2)}%`, label: 'Parliamentary seats held by youth (25–35)', compare: `${youthSeats} of ${meta.parliamentSeats}`, trend: 'down-bad', severity: 'red', barPct: (youthSeats / meta.parliamentSeats) * 100 },
      { topic: 'Digital Identity', value: `${jitter(40 + factor * 60, 8).toFixed(0)}%`, label: 'National ID coverage (% of population)', compare: 'Gateway to banking, voting, formal employment', trend: 'up-good', severity: 'green', barPct: jitter(40 + factor * 60, 8) },
      { topic: 'Brain Drain', value: `~${brainDrainPct}%`, label: 'Net youth emigration rate per year', compare: `Only ${passportPct}% hold passports — concentrated loss of skilled youth`, trend: 'up-bad', severity: 'gold', barPct: brainDrainPct * 10 },
      { topic: 'GYDI Rank', value: `${globalYouthDevRank}/183`, label: 'Global Youth Development Index (Commonwealth 2023)', compare: tier === 'Critical' ? 'Bottom quartile globally' : tier === 'Developing' ? 'Mid-band continentally' : 'Continental leader', trend: 'flat', severity: globalYouthDevRank > 130 ? 'red' : globalYouthDevRank > 80 ? 'gold' : 'green', barPct: 100 - (globalYouthDevRank / 183) * 100 },
      { topic: 'HIV Youth Share', value: `${jitter(20 + inv * 25, 5).toFixed(0)}%`, label: 'New HIV infections in youth 15–24', compare: 'Adolescent testing remains insufficient', trend: 'up-bad', severity: 'red', barPct: jitter(20 + inv * 25, 5) },
      { topic: 'Mental Health', value: `${jitter(20 + inv * 18, 4).toFixed(1)}%`, label: 'Youth with moderate–severe mental health indicators', compare: 'No dedicated federal youth mental health programme', trend: 'up-bad', severity: 'gold', barPct: jitter(20 + inv * 18, 4) },
    ],

    parliamentSeats: meta.parliamentSeats,
    youthSeats,
    pressFreedomRank,
    pressFreedomTotal: 180,
    voterRegYouthPct: +(jitter(45 + factor * 30, 6)).toFixed(0),
    totalVoterYouthPct: +(jitter(28 + factor * 12, 4)).toFixed(1),
    candidatesYouthPct: +(jitter(15 + factor * 25, 4)).toFixed(1),
    civicDigEngagement: Math.round(jitter(20 + factor * 80, 15)),
    govNarrative: `Young people in ${country} are turning out to register and vote in numbers far above their share of parliamentary seats. The data expose a system that mobilises youth electoral energy without translating it into governance access.`,

    hivYouthSharePct: +(jitter(20 + inv * 25, 5)).toFixed(0),
    mentalHealthBurdenPct: +(jitter(20 + inv * 18, 4)).toFixed(1),
    childMarriageAge: +(jitter(19 + factor * 4, 1.5)).toFixed(1),
    artCount: `${Math.round(jitter(80 + meta.popM * 4, 50))}K`,
    hivWomen: `${Math.round(jitter(2000 + inv * 12000, 1500)).toLocaleString()}`,
    unmetContraceptionPct: +(jitter(28 + inv * 30, 6)).toFixed(0),
    hivTestGirlsPct: +(jitter(10 + factor * 30, 4)).toFixed(0),
    hivTestBoysPct: +(jitter(8 + factor * 25, 3)).toFixed(0),
    childRightsActStates: tier === 'Fulfilling' ? 'Fully domesticated' : tier === 'Developing' ? 'Partially domesticated' : 'Inconsistent domestication',

    literacyPct,
    tertiaryGerPct,
    internetAccessPct,
    brainDrainPct,
    passportPct,
    bilateralDegreeAgrs: Math.round(jitter(4 + factor * 14, 3)),
    secondaryCompletionPct: +(jitter(40 + factor * 35, 6)).toFixed(0),

    digitalIdMillions: +(meta.popM * jitter(0.4 + factor * 0.5, 0.1)).toFixed(1),
    digitalIdTargetMillions: +(meta.popM * 0.85).toFixed(1),
    bankedMillions: +(meta.popM * jitter(0.18 + factor * 0.4, 0.05)).toFixed(1),
    bankedPct: +(jitter(20 + factor * 50, 6)).toFixed(0),
    noFormalIdPct: +(jitter(20 + inv * 35, 6)).toFixed(0),
    ndpaYear: 2023,

    legislation: [
      { name: 'Africa Youth Charter (AYC)', year: 'Ratified', status: tier === 'Fulfilling' ? 'active' : tier === 'Developing' ? 'partial' : 'weak', reality: `Ratified. AYEMI score of ${ayemiPct}% reflects ${tier === 'Fulfilling' ? 'strong' : tier === 'Developing' ? 'partial' : 'systemic non-'}compliance with AYC provisions. Annual youth rights status reporting to AUC is ${tier === 'Critical' ? 'absent' : 'partial'}.` },
      { name: 'AfCFTA Women & Youth Protocol', year: 'Active', status: 'partial', reality: `${country} is a signatory. Domestic operationalisation of youth economic participation mechanisms remains underdeveloped — no dedicated implementation body or monitoring framework.` },
      { name: 'Data Protection Act (NDPA-equivalent)', year: '2023', status: tier === 'Critical' ? 'partial' : 'active', reality: `Provides enforceable digital rights for youth in gig, fintech, and social platform contexts. Compliance economy creates youth employment pathway if professional training pipelines are developed.` },
      { name: 'National Youth Policy', year: '2019–23', status: tier === 'Critical' ? 'weak' : 'partial', reality: tier === 'Critical' ? 'Successor policy not in force. Programme delivery operates without a current statutory framework — a governance gap.' : 'Policy in force; implementation funding and sub-national delivery uneven.' },
      { name: 'Child Rights Act / Equivalent', year: 'In force', status: 'partial', reality: `Sub-national domestication uneven. Child marriage, juvenile justice, and protection mechanisms are operational but coverage gaps persist.` },
      { name: 'SDGs / AU Agenda 2063 Youth Targets', year: '2015/2063', status: tier === 'Fulfilling' ? 'active' : tier === 'Developing' ? 'partial' : 'weak', reality: `${tier === 'Fulfilling' ? 'On track for several youth-specific SDG targets.' : tier === 'Developing' ? 'Mixed progress on SDG 1, 4, 8, 16.' : 'Severely behind on SDG 1, 4, 8, 16. Voluntary national review reporting irregular.'}` },
    ],

    recommendations: [
      { num: '01', title: 'Mandate a 30% youth quota for executive appointments', desc: `Without structural requirements, youth inclusion in ${country}'s executive remains discretionary. A statutory quota would lock in representation across administrations.` },
      { num: '02', title: 'Cap nomination fees for youth candidates under 35', desc: `Establish capped, government-subsidised nomination fees for candidates under 35. Age eligibility reforms cannot deliver representation when nomination costs are prohibitive.` },
      { num: '03', title: 'Launch a National Youth Mental Health Programme', desc: `A meaningful share of ${country}'s youth carry a moderate-to-severe mental health burden with no federal pathway. A funded, time-bound national programme is overdue.` },
      { num: '04', title: 'Operationalise AfCFTA W&Y Protocol youth provisions domestically', desc: `Establish a dedicated interministerial body with budget and monitoring to deliver ${country}'s youth economic participation obligations under the AfCFTA Women & Youth Protocol.` },
      { num: '05', title: 'Mobile digital identity enrolment for rural and displaced youth', desc: `Accelerate enrolment in rural areas, IDP camps, and among young women. Digital identity is the gateway to formal employment, banking, and political participation.` },
      { num: '06', title: 'Enact a funded successor National Youth Policy (2026–2030)', desc: `${tier === 'Critical' ? 'The previous policy expired without replacement.' : 'The current cycle should be renewed with funded mandates.'} New policies must carry budgetary lines, not aspirational language.` },
      { num: '07', title: `${country} youth data platform — annual accountability infrastructure`, desc: `A centralised, publicly accessible youth statistics hub providing gender, cohort, region, disability, and urban/rural disaggregation in real time. Submit outputs annually to AUC under AYC obligations.` },
    ],
  };
}

// ───────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────
export function getCountryReport(slugOrName: string): CountryReport | null {
  const target = slugify(slugOrName);
  if (target === 'nigeria') return NIGERIA;

  // Find matching country in meta map
  const match = Object.keys(COUNTRY_META).find((c) => slugify(c) === target);
  if (!match) return null;
  return generateReport(match);
}

export function listCountries(): { country: string; slug: string; iso3: string; region: string }[] {
  return Object.entries(COUNTRY_META).map(([country, m]) => ({
    country,
    slug: slugify(country),
    iso3: m.iso3,
    region: m.region,
  }));
}

export function hasStaticReport(country: string): boolean {
  return slugify(country) === 'nigeria';
}
