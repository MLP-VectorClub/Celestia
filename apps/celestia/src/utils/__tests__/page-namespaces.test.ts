import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Pages only load the translation namespaces they ask for (`typedServerSideTranslations(locale, [...])`, plus `common` everywhere), so a component
 * that uses `t('colorGuide.…')` shows the bare key when it is rendered on a page that did not load `colorGuide`. The key test only checks that the
 * keys exist, this checks that each page loads what the components it pulls in use. It follows imports, so it can name a component that a page
 * imports but never renders: list those in `NOT_RENDERED` with the reason.
 */
const root = join(__dirname, '../../..');
const src = join(root, 'src');
const namespaces = readdirSync(join(root, 'public/locales/en'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''));

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : walk(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });

const resolveImport = (from: string, spec: string): string | null => {
  const base = spec.startsWith('src/') ? join(root, spec) : spec.startsWith('.') ? join(dirname(from), spec) : null;
  if (!base) return null;
  return ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((ext) => base + ext).find((candidate) => existsSync(candidate)) ?? null;
};

const IMPORT = /(?:import|export)\s[^;]*?from\s+'([^']+)'/g;
const usage = new RegExp(`(?:\\bt(?:\\.rich)?\\(\\s*|\\[\\s*)['"\`](${namespaces.join('|')})\\.`, 'g');

const importsOf = new Map<string, string[]>();
const namespacesOf = new Map<string, Set<string>>();
walk(src).forEach((file) => {
  const code = readFileSync(file, 'utf8');
  importsOf.set(
    file,
    [...code.matchAll(IMPORT)].map((m) => resolveImport(file, m[1])).filter((p): p is string => p !== null)
  );
  namespacesOf.set(file, new Set([...code.matchAll(usage)].map((m) => m[1])));
});

/** Every namespace used by the file and what it imports, with the files that use it */
const closure = (entry: string, skip: (file: string) => boolean = () => false): Map<string, Set<string>> => {
  const seen = new Set<string>();
  const used = new Map<string, Set<string>>();
  const visit = (file: string) => {
    if (seen.has(file) || skip(file)) return;
    seen.add(file);
    namespacesOf.get(file)?.forEach((ns) => used.set(ns, (used.get(ns) ?? new Set()).add(relative(root, file))));
    importsOf.get(file)?.forEach(visit);
  };
  visit(entry);
  return used;
};

const loadedBy = (page: string): Set<string> => {
  const code = readFileSync(page, 'utf8');
  const call = /typedServerSideTranslations\(\s*\w+\s*(?:,\s*\[([^\]]*)\])?/.exec(code);
  const names = (call?.[1] ?? '').match(/'(\w+)'/g)?.map((n) => n.replace(/'/g, '')) ?? [];
  return new Set(['common', ...names]);
};

/** `page → namespace → files` that pull in a namespace the page does not load, and are known not to render anything of it */
const NOT_RENDERED: Record<string, Record<string, string[]>> = {};

describe('translation namespaces', () => {
  const pages = walk(join(src, 'pages')).filter(
    (file) => !/_app|_error/.test(file) && /typedServerSideTranslations/.test(readFileSync(file, 'utf8'))
  );

  it('finds the pages', () => {
    expect(pages.length).toBeGreaterThan(20);
  });

  it.each(pages.map((page) => [relative(src, page), page]))('%s loads every namespace its components use', (name, page) => {
    const loaded = loadedBy(page);
    const missing = [...closure(page)]
      .filter(([ns]) => !loaded.has(ns))
      .map(([ns, files]) => `${ns}: ${[...files].filter((f) => !(NOT_RENDERED[name]?.[ns] ?? []).includes(f)).join(', ')}`)
      .filter((line) => !line.endsWith(': '));
    expect(missing, `Add the namespace to typedServerSideTranslations on ${name}`).toEqual([]);
  });

  it('the layout, which every page renders, only uses common', () => {
    const used = closure(join(src, 'pages/_app.tsx'));
    const other = [...used].filter(([ns]) => ns !== 'common').map(([ns, files]) => `${ns}: ${[...files].join(', ')}`);
    expect(other).toEqual([]);
  });
});
