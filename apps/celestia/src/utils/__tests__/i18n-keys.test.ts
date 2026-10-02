import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '../../..');
const localeDir = join(root, 'public/locales/en');
const messages: Record<string, unknown> = Object.fromEntries(
  readdirSync(localeDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(localeDir, f), 'utf8'))])
);

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });

const lookup = (key: string): unknown =>
  key
    .split('.')
    .reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), messages);
const namespaces = Object.keys(messages);

/** `t('ns.a.b')`, `t(\`ns.a.${x}\`)` and `['ns.a.b']` titles, with the part before any `${}` as the checked prefix */
const KEY = /\bt\(\s*(['"`])((?:ns)\.[\w.${}\-[\]()?: ']*?)\1/g;

describe('translation keys', () => {
  const used: Array<{ file: string; key: string }> = [];
  sourceFiles(join(root, 'src')).forEach((file) => {
    const source = readFileSync(file, 'utf8');
    const pattern = new RegExp(KEY.source.replace('ns', `(?:${namespaces.join('|')})`), 'g');
    for (const match of source.matchAll(pattern)) used.push({ file: file.replace(`${root}/`, ''), key: match[2] });
  });

  it('finds the keys the code uses', () => {
    expect(used.length).toBeGreaterThan(100);
  });

  it('only uses keys that exist in the English files', () => {
    const missing = used
      .map(({ file, key }) => ({ file, key, prefix: key.includes('${') ? key.slice(0, key.indexOf('${')).replace(/\.$/, '') : key }))
      .filter(({ prefix }) => lookup(prefix) === undefined)
      .map(({ file, key }) => `${file}: ${key}`);
    expect(missing).toEqual([]);
  });
});
