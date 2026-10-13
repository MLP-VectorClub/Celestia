// Lists the controls (buttons and button-like links) of each page with the icon each one carries, on the old site and on Celestia,
// and prints the controls that have an icon on the old site but none on Celestia.
//   SEED=1 node scripts/ui-audit/icons.mjs [pages] [roles]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('../../apps/celestia/node_modules/playwright');
const sites = { wc: 'http://127.0.0.1:8768', ce: 'http://localhost:3000' };
const pages = {
  voted: '/episode/3', recent: '/episode/1',
  guide: '/cg/pony', full: '/cg/pony/full', changes: '/cg/pony/changes', tags: '/cg/pony/tags', appearance: '/cg/pony/v/1', blending: '/cg/blending', picker: '/cg/picker',
  episode: '/episode/1', show: '/show', movie: '/movie/2', events: '/events', event: '/event/1', users: '/users', profile: '/users/9001', pcg: '/users/9001/cg',
  pcghist: '/users/9001/cg/point-history', account: '/users/9001/account', admin: '/admin', logs: '/admin/logs', usefullinks: '/admin/usefullinks', notices: '/admin/notices', pcgadmin: '/admin/pcg-appearances',
};
const ACCOUNTS = { user: 9001, member: 9008, assistant: 9009, staff: 9002, developer: 9007 };
const only = process.argv[2] ? process.argv[2].split(',') : Object.keys(pages);
const roles = (process.argv[3] || 'member,staff').split(',');
const b = await chromium.launch();
const result = {};
for (const role of roles) for (const [site, base] of Object.entries(sites)) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, bypassCSP: true });
  const p = await ctx.newPage();
  for (const name of only) {
    await p.goto(`${base}/test-login/${ACCOUNTS[role]}`).catch(() => {});
    await p.goto(base + pages[name], { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await p.waitForTimeout(1000);
    result[`${name}/${role}/${site}`] = await p.evaluate(() => {
      const scope = document.querySelector('#content, #main, main') || document.body;
      const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      const iconOf = (e) => {
        // Old site: a typcn-* class on the control itself or on a child; Celestia: an svg with data-icon
        for (const t of [e, ...e.querySelectorAll('[class*="typcn"], svg[data-icon], img')]) {
          const typcn = (t.getAttribute('class') || '').match(/typcn-[\w-]+/)?.[0];
          if (typcn) return typcn;
          if (t.getAttribute('data-icon')) return t.getAttribute('data-icon');
          if (t.tagName === 'IMG') return 'img';
        }
        const before = getComputedStyle(e, '::before').content;
        return before && before !== 'none' && before !== 'normal' && before !== '""' ? 'before:' + before.slice(0, 6) : '';
      };
      return [...scope.querySelectorAll('button, .btn, a[class*="btn"], input[type=button]')].filter(vis).map((e) => {
        const label = (e.innerText || e.title || e.getAttribute('aria-label') || e.value || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        const tip = (e.title || e.getAttribute('aria-label') || '').slice(0, 40);
        return { label: label || tip, tip, icon: iconOf(e) };
      });
    });
  }
  await ctx.close();
}
await b.close();
for (const key of Object.keys(result).filter((k) => k.endsWith('/wc'))) {
  const ce = result[key.replace(/wc$/, 'ce')] ?? [];
  const find = (arr, x) => arr.filter((y) => (x.label && y.label === x.label) || (x.tip && y.tip === x.tip));
  const gaps = [];
  for (const x of result[key].filter((x) => x.icon)) {
    const m = find(ce, x);
    if (!m.length) gaps.push(`  MISSING control ${JSON.stringify(x.label || x.tip)} (${x.icon})`);
    else if (!m.some((y) => y.icon)) gaps.push(`  NO ICON    ${JSON.stringify(x.label || x.tip)} (old: ${x.icon})`);
  }
  if (gaps.length) console.log(key.replace(/\/wc$/, ''), '\n' + [...new Set(gaps)].join('\n'));
}
if (process.env.DUMP) for (const [k, v] of Object.entries(result)) console.log(k, v.length, v.filter((x) => x.icon).length);
if (process.env.LIST) for (const [k, v] of Object.entries(result)) console.log(k, JSON.stringify(v.map((x) => `${x.label || x.tip}${x.icon ? ' [' + x.icon + ']' : ''}`)));
