// Usage: node scripts/smoke-pages.mjs <screenshot dir> [frontend base] [Luna base]
// Visits the main pages in headless Chromium as Luna's seeded admin (bearer token from POST /test/login/9002, sent with every request),
// prints the status and heading of each page plus console errors and failed requests, and saves a screenshot per page.
// Needs  (see apps/celestia/CLAUDE.md) and Luna's contract server running.
import { mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const pnpmDir = new URL('../node_modules/.pnpm/', import.meta.url).pathname;
const playwrightDir = readdirSync(pnpmDir).find((d) => d.startsWith('playwright@'));
const { chromium } = createRequire(pnpmDir + playwrightDir + '/node_modules/playwright/package.json')('playwright');
const S = process.argv[2];
const FRONT = process.argv[3] ?? 'http://127.0.0.1:3100';
const LUNA = process.argv[4] ?? 'http://127.0.0.1:8766';
mkdirSync(S + '/shots', { recursive: true });
const login = await (await fetch(`${LUNA}/test/login/9002`, { method: 'POST' })).json();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { Authorization: `Bearer ${login.token}` } });
const pages = ['/', '/show', '/episode/S1E1-Friendship-is-Magic-Part-1', '/events', '/cg', '/cg/pony', '/cg/pony/full', '/cg/pony/tags', '/users/9002', '/users/9002/account', '/admin', '/admin/logs', '/admin/notices', '/admin/useful-links', '/admin/settings', '/blending', '/blending-reverse', '/picker', '/users/verify'];
for (const path of pages) {
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/Content-Security-Policy|legacyBehavior|8765\/img\/blank-pixel/.test(m.text())) problems.push('console: ' + m.text().slice(0, 160)); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message.slice(0, 140)));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon')) problems.push(`${r.status()} ${r.url().replace(FRONT, '').slice(0, 90)}`); });
  let status = '?';
  try { const res = await page.goto(FRONT + path, { waitUntil: 'networkidle', timeout: 45000 }); status = res.status(); } catch (e) { problems.push('goto: ' + e.message.slice(0, 100)); }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${S}/shots/${path.replace(/[^a-z0-9]+/gi, '_') || 'home'}.png` });
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  console.log(String(status).padEnd(4), path.padEnd(42), JSON.stringify(h1), problems.length ? '\n     ' + [...new Set(problems)].join('\n     ') : '');
  await page.close();
}
await browser.close();
