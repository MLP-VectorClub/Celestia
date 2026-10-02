// Usage: node scripts/validate-contract.mjs <api base> <path to api.json> [bearer token] [cookie header]; UID_=<user id for /users/{id}> (default 9002)
// Calls every non-internal GET operation and validates 200 responses against the spec (additionalProperties:false stripped, nullable converted).
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.dirname + '/../node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/package.json');
const Ajv = require('ajv/dist/2019.js').default ?? require('ajv').default;
const [base, specPath, token, cookie] = process.argv.slice(2);
const doc = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const fix = (n) => {
  if (Array.isArray(n)) return n.map(fix);
  if (n && typeof n === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(n)) { if (k === 'additionalProperties' && v === false) continue; if (k === 'example' || k === 'x-internal') continue; o[k] = fix(v); }
    if (o.nullable === true) { delete o.nullable; if (o.$ref) return { anyOf: [o, { type: 'null' }] }; if (o.type) o.type = [].concat(o.type, 'null'); else return { anyOf: [o, { type: 'null' }] }; }
    delete o.nullable;
    return o;
  }
  return n;
};
const ajv = new Ajv({ strict: false, allErrors: false, validateFormats: false });
const comps = fix(doc.components);
const ids = { id: '1', entryid: '1', key: 'cg_itemsperpage', type: 'requests', username: 'test', guide: 'pony' };
const hdr = {}; if (token) hdr.Authorization = 'Bearer ' + token; if (cookie) hdr.Cookie = cookie;
let ok = 0, bad = 0, skipped = 0;
for (const [p, o] of Object.entries(doc.paths)) {
  const g = o.get; if (!g || g['x-internal']) continue;
  const resp = g.responses?.['200']?.content?.['application/json']?.schema; if (!resp) { skipped++; continue; }
  const uid = process.env.UID_ || '9002';
  const q = (g.parameters || []).filter((x) => x.in === 'query' && x.required).map((x) => { const sc = x.schema?.$ref ? (doc.components.schemas[x.schema.$ref.split('/').pop()] || {}) : (x.schema || {}); const val = sc.enum ? sc.enum[0] : sc.type === 'integer' ? (sc.minimum ?? 1) : x.name === 'guide' ? 'pony' : 'a'; return `${x.name}=${encodeURIComponent(val)}`; }).join('&');
  const url = base + p.replace(/\{(\w+)\}/g, (_, k) => (p.startsWith('/users/') && k === 'id') ? uid : (ids[k] ?? '1')) + (q ? '?' + q : '');
  let r; try { r = await fetch(url, { headers: { Accept: 'application/json', ...hdr } }); } catch (e) { console.log('ERR ', p, e.message); bad++; continue; }
  const text = await r.text();
  if (r.status >= 500) { console.log(`5xx ${r.status} ${p}`, text.slice(0, 120).replace(/\n/g, ' ')); bad++; continue; }
  if (r.status !== 200) { skipped++; console.log('skip', r.status, p); continue; }
  let body; try { body = JSON.parse(text); } catch { console.log('NONJSON', p); bad++; continue; }
  let v; try { v = ajv.compile({ components: comps, ...fix(resp) }); } catch (e) { console.log('SCHEMA', p, e.message.slice(0, 100)); bad++; continue; }
  if (v(body)) ok++; else { bad++; const e = v.errors[0]; console.log('BAD', p, e.instancePath, e.message, JSON.stringify(e.params).slice(0, 100)); }
}
console.log({ ok, bad, skipped });
