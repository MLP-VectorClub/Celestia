// Opens public pages of the production front end as a guest and reports status, console errors and failed requests.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('../../apps/celestia/node_modules/playwright');
const base = process.argv[2] || 'https://next.mlpvector.club';
const paths = ['/', '/cg', '/cg/pony', '/cg/pony/full', '/cg/pony/tags', '/cg/pony/changes', '/cg/blending', '/cg/blending-reverse', '/cg/picker', '/show', '/episode/latest', '/events', '/users', '/about', '/about/privacy'];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
for (const path of paths) {
  const errors = [];
  p.removeAllListeners();
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 120)));
  p.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url().slice(0, 100)}`));
  const r = await p.goto(base + path, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => ({ status: () => String(e).slice(0, 60) }));
  console.log(path, r.status(), (await p.title()).slice(0, 50), errors.length ? errors : '');
}
await b.close();
