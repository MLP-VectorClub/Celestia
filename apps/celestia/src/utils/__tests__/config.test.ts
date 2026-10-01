import { describe, expect, it } from 'vitest';

import { compilePattern, compilePatterns } from 'src/utils/config';

describe('compilePattern', () => {
  it('rebuilds a regular expression from its source and flags', () => {
    const pattern = compilePattern({ source: '^#?[0-9a-f]{6}$', flags: 'i' });
    expect(pattern.test('#FFAA00')).toBe(true);
    expect(pattern.test('nope')).toBe(false);
  });

  it('keeps the source free of delimiters', () => {
    const patterns = compilePatterns({
      printableAscii: { source: '^[\\x20-\\x7e]+$', flags: '' },
      hexColor: { source: '^#[0-9a-f]{6}$', flags: 'i' },
      username: { source: '^[a-z\\d-]+$', flags: 'i' },
      episodeTitle: { source: '^[A-Za-z ]+$', flags: 'u' },
    });
    expect(patterns.username.source).not.toMatch(/^\//);
    expect(patterns.episodeTitle.unicode).toBe(true);
  });
});
