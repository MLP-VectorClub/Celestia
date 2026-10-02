// Usage: node scripts/check-oauth-popup.mjs [frontend base]
// Needs `next dev` on the frontend base (default http://127.0.0.1:3100, see apps/celestia/CLAUDE.md). Checks that signing in through a popup updates the
// page that opened it, also when the provider's sign-in page sends `Cross-Origin-Opener-Policy` (which cuts the link between the two windows, as
// DeviantArt's pages do). DeviantArt and /users/me are faked: a local page on :3201 plays the provider, /users/me answers 401 until the popup asks.
import { readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
const pnpmDir = new URL('../node_modules/.pnpm/', import.meta.url).pathname;
const d = readdirSync(pnpmDir).find((x) => x.startsWith('playwright@'));
const { chromium } = createRequire(pnpmDir + d + '/node_modules/playwright/package.json')('playwright');
const FRONT = process.argv[2] ?? 'http://127.0.0.1:3100';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
let signedIn = false;
const user = { user: { id: 9001, name: 'Poster', role: 'user', avatarUrl: null, avatarProvider: 'deviantart' }, sessionUpdating: false };
// The popup is the first page to ask while the sign-in "completes"; the opener only sees the user after that
await ctx.route('**/api/users/me', (route) => {
  const fromPopup = route.request().frame()?.page().url().includes('/oauth/');
  if (fromPopup) signedIn = true;
  return signedIn ? route.fulfill({ json: user }) : route.fulfill({ status: 401, json: { message: 'Unauthenticated.' } });
});
await ctx.route('**/api/users/oauth/signin/deviantart*', (route) => route.fulfill({ status: 302, headers: { Location: 'http://127.0.0.1:3201/authorize' } }));
const da = createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html', 'Cross-Origin-Opener-Policy': 'same-origin' }); res.end('<p>Pretend DeviantArt</p><script>setTimeout(() => { location = "' + FRONT + '/oauth/deviantart"; }, 800)</script>'); }).listen(3201);
const opener = await ctx.newPage();
const errors = [];
opener.on('pageerror', (e) => errors.push(e.message));
await opener.goto(FRONT + '/cg/pony', { waitUntil: 'networkidle' });
await opener.getByRole('button', { name: /sign in/i }).first().click();
const dlg = opener.locator('.modal.show'); await dlg.waitFor();
console.log('modal open before sign-in:', await dlg.count() === 1);
const [popup] = await Promise.all([ctx.waitForEvent('page'), dlg.getByRole('button', { name: /deviantart/i }).click()]);
await popup.waitForLoadState();
await opener.waitForTimeout(300);
console.log('opener sees window.opener of popup severed (COOP):', await popup.evaluate(() => window.opener === null));
let closedAfter = null; const t0 = Date.now();
popup.on('close', () => { closedAfter = (Date.now() - t0) / 1000; });
await opener.locator('.modal.show').waitFor({ state: 'detached', timeout: 15000 }).then(() => console.log('opener: sign-in dialog closed by itself, no refresh', ((Date.now() - t0) / 1000).toFixed(1) + 's'), () => console.log('opener: dialog STILL OPEN after 15s'));
await opener.waitForTimeout(2500); console.log('  popup url now:', popup.isClosed() ? 'closed' : popup.url());
console.log('popup closed itself:', popup.isClosed(), closedAfter !== null ? `after ${closedAfter}s` : '');
console.log('opener shows signed-in user:', await opener.getByText('Poster').first().isVisible().catch(() => false), '| opener errors:', errors);
await b.close(); da.close();
