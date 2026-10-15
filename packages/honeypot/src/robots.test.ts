import { describe, expect, it } from 'vitest';

import { compileHoneypots } from './patterns';
import { buildRobotsTxt } from './robots';

describe('buildRobotsTxt', () => {
  const honeypotLines = compileHoneypots(['/.env', '/wp-admin/**']).robotsLines;
  const txt = buildRobotsTxt({ comment: 'Hello', rules: ['Disallow: /admin'], honeypotLines });

  it('lists the rules and then every trap', () => {
    const lines = txt.split('\n');
    expect(lines).toEqual(expect.arrayContaining(['User-agent: *', 'Disallow: /admin', 'Disallow: /.env', 'Disallow: /wp-admin/*']));
    expect(lines.indexOf('Disallow: /admin')).toBeLessThan(lines.indexOf('Disallow: /.env'));
  });

  it('is one group of rules (a blank line would orphan the traps)', () => {
    expect(txt.trim()).not.toMatch(/\n\s*\n/);
  });

  it('does not say anywhere that some of the lines are traps', () => {
    expect(txt.toLowerCase()).not.toMatch(/trap|honeypot|refused|bait/);
    expect(txt.split('\n').filter((line) => line.startsWith('#'))).toEqual(['# Hello']);
  });
});
