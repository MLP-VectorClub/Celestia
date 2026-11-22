/**
 * Our CSP is `script-src 'self'`: a page whose HTML has an executable inline `<script>` (no `src`, not a JSON data block) does not start in the browser.
 * Next 16.4's Turbopack shared runtime does exactly that unless `experimental.turbopackSharedRuntime` is false (https://github.com/vercel/next.js/issues/100906),
 * and nothing else notices: the build, the lint and the unit tests all pass. Run after `next build` (CI does), this fails when any prerendered page has one.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The executable inline scripts of a page: the ones the CSP would refuse. `application/json` and `application/ld+json` blocks are data, not code */
export const findExecutableInlineScripts = (html) =>
  [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes]) => !/\bsrc\s*=/i.test(attributes) && !/\btype\s*=\s*["']?(application\/(ld\+)?json|importmap|speculationrules)/i.test(attributes))
    .map(([, , code]) => code.trim().slice(0, 80));

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? htmlFiles(path) : path.endsWith('.html') ? [path] : [];
  });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ?? '.next/server/pages';
  const files = htmlFiles(root);
  if (files.length === 0) {
    console.error(`No prerendered pages found in ${root}: build first`);
    process.exit(1);
  }
  const offenders = files.map((file) => [file, findExecutableInlineScripts(readFileSync(file, 'utf8'))]).filter(([, found]) => found.length > 0);
  for (const [file, found] of offenders) console.error(`${file}: executable inline script (${found[0]}...)`);
  if (offenders.length > 0) {
    console.error("The CSP (script-src 'self') blocks these and the pages would not start. See https://github.com/vercel/next.js/issues/100906");
    process.exit(1);
  }
  console.log(`${files.length} prerendered pages, no executable inline scripts`);
}
