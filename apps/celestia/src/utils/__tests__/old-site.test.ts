import { describe, expect, it } from 'vitest';

import { oldSiteUrl } from 'src/utils/old-site';

describe('oldSiteUrl', () => {
  it('keeps the path and query of the page', () => {
    expect(oldSiteUrl('/cg/pony/full?page=2')).toBe('https://old.mlpvector.club/cg/pony/full?page=2');
    expect(oldSiteUrl('/')).toBe('https://old.mlpvector.club/');
  });

  it('adds the missing slash', () => {
    expect(oldSiteUrl('episodes')).toBe('https://old.mlpvector.club/episodes');
  });
});
