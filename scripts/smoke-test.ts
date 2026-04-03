/**
 * AYD Platform Smoke Test
 *
 * Run: pnpm smoke-test
 * Against production: API_URL=https://api.example.com/api pnpm smoke-test
 *
 * Start the server first: pnpm dev:api
 */

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  statusCode?: number;
  responseTime: number;
  message?: string;
}

const results: TestResult[] = [];
let adminToken: string | null = null;
let demoToken: string | null = null;

async function test(
  name: string,
  method: string,
  endpoint: string,
  options?: {
    body?: any;
    token?: string;
    expectedStatus?: number;
    validate?: (data: any) => boolean;
    warnOnly?: boolean;
  },
): Promise<any> {
  const start = Date.now();
  const url = `${API_BASE}${endpoint}`;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options?.token) headers['Authorization'] = `Bearer ${options.token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const elapsed = Date.now() - start;
    const expectedStatus = options?.expectedStatus || 200;

    if (res.status !== expectedStatus) {
      results.push({
        name, endpoint, method,
        status: options?.warnOnly ? 'WARN' : 'FAIL',
        statusCode: res.status,
        responseTime: elapsed,
        message: `Expected ${expectedStatus}, got ${res.status}`,
      });
      return null;
    }

    let data: any = null;
    try { data = await res.json(); } catch { /* no body */ }

    if (options?.validate && data && !options.validate(data)) {
      results.push({
        name, endpoint, method,
        status: 'WARN',
        statusCode: res.status,
        responseTime: elapsed,
        message: 'Response validation failed',
      });
      return data;
    }

    results.push({
      name, endpoint, method,
      status: 'PASS',
      statusCode: res.status,
      responseTime: elapsed,
    });

    return data;
  } catch (err: any) {
    results.push({
      name, endpoint, method,
      status: 'FAIL',
      responseTime: Date.now() - start,
      message: err.message,
    });
    return null;
  }
}

async function run() {
  console.log('\n  AYD PLATFORM SMOKE TEST');
  console.log('='.repeat(60));
  console.log(`Target: ${API_BASE}\n`);

  // ── HEALTH & PLATFORM ──
  console.log('Health & Platform...');
  await test('Health check', 'GET', '/health');
  await test('Platform stats', 'GET', '/platform/stats', {
    validate: (d) => typeof d.countries === 'number' || typeof d.totalCountries === 'number',
  });

  // ── AUTH ──
  console.log('Authentication...');
  const signInData = await test('Admin sign in', 'POST', '/auth/signin', {
    body: { email: 'admin@africanyouthdatabase.org', password: 'AYD@Admin2026!' },
    validate: (d) => !!d.tokens?.accessToken,
  });
  if (signInData?.tokens?.accessToken) adminToken = signInData.tokens.accessToken;

  const demoData = await test('Demo user sign in', 'POST', '/auth/signin', {
    body: { email: 'demo@africanyouthdatabase.org', password: 'AYD@Demo2026!' },
    validate: (d) => !!d.tokens?.accessToken,
    warnOnly: true,
  });
  if (demoData?.tokens?.accessToken) demoToken = demoData.tokens.accessToken;

  await test('Get profile (admin)', 'GET', '/auth/profile', { token: adminToken! });
  await test('Invalid credentials (should 401)', 'POST', '/auth/signin', {
    body: { email: 'fake@test.com', password: 'wrong' },
    expectedStatus: 401,
  });

  // ── COUNTRIES ──
  console.log('Countries...');
  await test('List all countries', 'GET', '/countries', {
    validate: (d) => {
      const items = Array.isArray(d) ? d : d?.data;
      return Array.isArray(items) && items.length >= 50;
    },
  });
  await test('Filter by region', 'GET', '/countries?region=West%20Africa');
  await test('Search countries', 'GET', '/countries?search=nigeria');

  // ── THEMES ──
  console.log('Themes...');
  await test('List themes', 'GET', '/themes', {
    validate: (d) => {
      const items = Array.isArray(d) ? d : d?.data;
      return Array.isArray(items) && items.length >= 9;
    },
  });

  // ── INDICATORS ──
  console.log('Indicators...');
  await test('List indicators', 'GET', '/indicators', {
    validate: (d) => {
      const items = Array.isArray(d) ? d : d?.data;
      return Array.isArray(items) && items.length >= 40;
    },
  });

  // ── DATA ──
  console.log('Data endpoints...');
  await test('Data values', 'GET', '/data/values?yearStart=2020&yearEnd=2023', { warnOnly: true });
  await test('Regional averages', 'GET', '/data/regional-averages?year=2023', { warnOnly: true });
  await test('Bar chart data', 'GET', '/data/bar-chart?indicatorId=youth-unemployment-rate&limit=10', { warnOnly: true });

  // ── YOUTH INDEX ──
  console.log('Youth Index...');
  await test('Youth Index rankings', 'GET', '/youth-index/rankings', {
    validate: (d) => {
      const items = Array.isArray(d) ? d : d?.data;
      return Array.isArray(items) && items.length > 0;
    },
  });
  await test('Top 5 performers', 'GET', '/youth-index/top/5', { warnOnly: true });

  // ── COMPARE ──
  console.log('Compare...');
  await test('Compare regions', 'GET', '/compare/regions?indicatorId=youth-unemployment-rate', { warnOnly: true });

  // ── POLICY MONITOR ──
  console.log('Policy Monitor...');
  await test('Policy rankings', 'GET', '/policy-monitor/rankings');
  await test('Policy summary', 'GET', '/policy-monitor/summary');

  // ── INSIGHTS ──
  console.log('Insights...');
  await test('AI status', 'GET', '/insights/status', {
    validate: (d) => typeof d.aiAvailable === 'boolean',
    warnOnly: true,
  });
  await test('Anomalies', 'GET', '/insights/anomalies', { warnOnly: true });
  await test('Correlations', 'GET', '/insights/correlations', { warnOnly: true });

  // ── NLQ ──
  console.log('Natural Language Query...');
  await test('NLQ query', 'POST', '/nlq/query', {
    body: { question: 'What is the youth unemployment rate in Nigeria?' },
    validate: (d) => !!d.answer,
    warnOnly: true,
  });

  // ── EXPERTS ──
  console.log('Experts...');
  await test('List experts', 'GET', '/experts');
  await test('Expert stats', 'GET', '/experts/stats', { warnOnly: true });

  // ── SEARCH ──
  console.log('Search...');
  await test('Global search', 'GET', '/search?q=nigeria', {
    validate: (d) => d.totalResults > 0,
    warnOnly: true,
  });

  // ── DASHBOARDS ──
  console.log('Dashboards...');
  await test('Public dashboards', 'GET', '/dashboards/public', { warnOnly: true });

  // ── EXPORT ──
  console.log('Export...');
  await test('Export CSV', 'GET', '/export/csv?yearStart=2020&yearEnd=2023', { warnOnly: true });
  await test('Export JSON', 'GET', '/export/json?yearStart=2020&yearEnd=2023', { warnOnly: true });

  // ── EMBED ──
  console.log('Embed...');
  await test('Embed config', 'GET', '/embed/config');

  // ── LIVE FEED ──
  console.log('Live Feed...');
  await test('Live pulse', 'GET', '/live-feed/pulse');
  await test('Live ticker', 'GET', '/live-feed/ticker');

  // ── ADMIN (admin token required) ──
  console.log('Admin...');
  await test('Admin system info', 'GET', '/admin/system', { token: adminToken!, warnOnly: true });
  await test('Admin data gaps', 'GET', '/admin/data/gaps', { token: adminToken!, warnOnly: true });
  await test('Admin user stats', 'GET', '/admin/users/stats', { token: adminToken!, warnOnly: true });

  // ── DATA UPLOAD ──
  console.log('Data Upload...');
  await test('Upload needed', 'GET', '/data-upload/needed', { token: adminToken!, warnOnly: true });
  await test('Upload templates', 'GET', '/data-upload/templates', { token: adminToken!, warnOnly: true });
  await test('Upload indicators', 'GET', '/data-upload/indicators', { token: adminToken!, warnOnly: true });

  // ── AUTH HARDENING ──
  console.log('Auth hardening...');
  await test('Forgot password', 'POST', '/auth/forgot-password', {
    body: { email: 'admin@africanyouthdatabase.org' },
    validate: (d) => !!d.code,
    warnOnly: true,
  });
  await test('Change password (no auth, should 401)', 'PUT', '/auth/change-password', {
    body: { currentPassword: 'test', newPassword: 'Test1234!' },
    expectedStatus: 401,
  });

  // ── RLS CHECKS ──
  console.log('RLS Policy checks...');
  await test('Unauthenticated admin access (should 401)', 'GET', '/admin/system', { expectedStatus: 401 });
  if (demoToken) {
    await test('Demo user admin access (should 403)', 'GET', '/admin/system', {
      token: demoToken,
      expectedStatus: 403,
      warnOnly: true,
    });
  }

  // ── PRINT RESULTS ──
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS\n');

  const passed = results.filter((r) => r.status === 'PASS');
  const warned = results.filter((r) => r.status === 'WARN');
  const failed = results.filter((r) => r.status === 'FAIL');

  for (const r of results) {
    const icon = r.status === 'PASS' ? 'PASS' : r.status === 'WARN' ? 'WARN' : 'FAIL';
    const time = `${r.responseTime}ms`.padStart(6);
    const status = `[${r.statusCode || '???'}]`.padEnd(6);
    console.log(`${icon} ${time} ${status} ${r.method.padEnd(5)} ${r.endpoint}`);
    if (r.message) console.log(`         > ${r.message}`);
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`PASSED: ${passed.length}`);
  console.log(`WARNS:  ${warned.length}`);
  console.log(`FAILED: ${failed.length}`);
  console.log(`TOTAL:  ${results.length}`);
  console.log('-'.repeat(60));

  const avgTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length);
  const maxTime = Math.max(...results.map((r) => r.responseTime));
  console.log(`Avg response: ${avgTime}ms | Max: ${maxTime}ms`);

  if (failed.length > 0) {
    console.log(`\n${failed.length} tests FAILED. Fix these before deploying.`);
    process.exit(1);
  } else if (warned.length > 5) {
    console.log(`\n${warned.length} warnings. Review before deploying.`);
  } else {
    console.log('\nAll critical tests passed. Ready to deploy!');
  }
}

run().catch(console.error);
