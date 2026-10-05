import fs from 'node:fs';
import { createRequire } from 'node:module';

// playwright is a dependency of apps/celestia only
const { chromium } = createRequire(import.meta.url)('../../apps/celestia/node_modules/playwright');
const out = process.argv[2];
const sites = { wc: 'http://127.0.0.1:8768', ce: 'http://localhost:3000' };
const pages = {
  cgindex: '/cg', guide: '/cg/pony', full: '/cg/pony/full', changes: '/cg/pony/changes', tags: '/cg/pony/tags',
  appearance: '/cg/pony/v/132', blending: '/cg/blending', reverse: '/cg/blending-reverse', picker: '/cg/picker',
  episode: '/episode/latest', show: '/show', movie: '/movie/1', events: '/events', event: '/event/1',
  users: '/users', profile: '/users/136', pcgprofile: '/users/332', pcg: '/users/332/cg', pcghist: '/users/332/cg/point-history',
  about: '/about', privacy: '/about/privacy', admin: '/admin', logs: '/admin/logs', usefullinks: '/admin/usefullinks', notices: '/admin/notices',
  account: '/users/136/account',
};
const only = process.argv[3] ? process.argv[3].split(',') : Object.keys(pages);
const b = await chromium.launch();
const inventory = {};
const roles = (process.argv[4] || 'guest,admin').split(',');
for (const role of roles) {
  for (const [site, base] of Object.entries(sites)) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, bypassCSP: true });
    const p = await ctx.newPage();
    for (const name of only) {
      const key = `${name}-${role}-${site}`;
      try {
        // The old site's page scripts sign a test session out again when the DeviantArt token refresh fails, so sign in before every page
        if (role === 'admin') await p.goto(`${base}/test-login/136`).catch(() => {});
        await p.goto(base + pages[name], { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
        await p.waitForTimeout(1200);
        await p.screenshot({ path: `${out}/${key}.png`, fullPage: true });
        inventory[key] = await p.evaluate(() => {
          const scope = document.querySelector('#content, #main, main') || document.body;
          const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
          const txt = (e) => (e.innerText || e.title || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
          return {
            url: location.pathname + location.search,
            title: document.title,
            h: [...scope.querySelectorAll('h1,h2,h3')].filter(vis).map(txt),
            links: [...scope.querySelectorAll('a[href]')].filter(vis).map((e) => txt(e) + ' -> ' + (e.getAttribute('href') || '').slice(0, 60)),
            buttons: [...scope.querySelectorAll('button, input[type=button], input[type=submit], .btn')].filter(vis).map(txt),
            inputs: [...scope.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(vis).map((e) => (e.name || e.id || e.type) + ':' + (e.placeholder || '')),
          };
        });
      } catch (e) { inventory[key] = { error: String(e).slice(0, 100) }; }
    }
    await ctx.close();
  }
}
fs.writeFileSync(`${out}/inventory.json`, JSON.stringify(inventory, null, 1));
console.log('done', Object.keys(inventory).length);
await b.close();
