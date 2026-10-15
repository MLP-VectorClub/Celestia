import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { proxy } from 'src/proxy';

const appRoot = path.resolve(__dirname, '../../..');
const nextConfig = readFileSync(path.join(appRoot, 'next.config.js'), 'utf8');
const robots = readFileSync(path.join(appRoot, 'public/robots.txt'), 'utf8');

const honeypotSources = [
  ...nextConfig
    .slice(nextConfig.indexOf('const HONEYPOTS'), nextConfig.indexOf('];', nextConfig.indexOf('const HONEYPOTS')))
    .matchAll(/source: '([^']+)'/g),
].map((match) => match[1]);

describe('honeypots', () => {
  it('are the three paths scanners ask for', () => {
    expect(honeypotSources).toEqual(['/.env', '/wp-admin', '/admin.php']);
  });

  it('are every one of them listed as disallowed in robots.txt, so only what ignores it ends up there', () => {
    const disallowed = robots
      .split('\n')
      .filter((line) => line.startsWith('Disallow:'))
      .map((line) => line.slice('Disallow:'.length).trim());
    honeypotSources.forEach((source) => expect(disallowed).toContain(source));
  });

  it('sit in the one group of rules (a blank line would orphan them)', () => {
    expect(robots.trim()).not.toMatch(/\n\s*\n/);
  });
});

describe('proxy', () => {
  it('refuses everything for a visitor Luna flagged', async () => {
    const response = proxy(new NextRequest('https://example.test/cg/pony', { headers: { cookie: 'blocked=1' } }));
    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Forbidden');
  });

  it('leaves other visitors alone', () => {
    const response = proxy(new NextRequest('https://example.test/cg/pony', { headers: { cookie: 'blocked=0; a=b' } }));
    expect(response.status).toBe(200);
  });
});
