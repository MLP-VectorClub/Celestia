import { describe, expect, it } from 'vitest';

import { appearanceShareUrl } from 'src/utils/share-url';

describe('appearanceShareUrl', () => {
  const url = 'https://example.com/cg/v/5';

  it('leaves the link alone without a token (public appearances, or visitors who cannot share a private one)', () => {
    expect(appearanceShareUrl(url)).toBe(url);
    expect(appearanceShareUrl(url, null)).toBe(url);
    expect(appearanceShareUrl(url, '')).toBe(url);
  });

  it('adds the token of a private appearance', () => {
    expect(appearanceShareUrl(url, '0f0e-1a')).toBe(`${url}?token=0f0e-1a`);
  });

  it('extends a link that has a query string already and escapes the token', () => {
    expect(appearanceShareUrl(`${url}?a=1`, 'x y')).toBe(`${url}?a=1&token=x%20y`);
  });
});
