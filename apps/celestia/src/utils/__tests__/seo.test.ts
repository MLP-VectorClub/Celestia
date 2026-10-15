import { describe, expect, it } from 'vitest';

import { canonicalPageUrl } from 'src/utils/seo';

describe('canonicalPageUrl', () => {
  it('ends in the path of the page', () => {
    expect(canonicalPageUrl('/cg/pony')).toMatch(/\/cg\/pony$/);
  });

  it('drops the fragment and tracking or search state, keeps the page of a list', () => {
    expect(canonicalPageUrl('/cg/pony?utm_source=x&q=twilight#p5')).toMatch(/\/cg\/pony$/);
    expect(canonicalPageUrl('/cg/pony?page=3&utm_source=x')).toMatch(/\/cg\/pony\?page=3$/);
  });

  it('treats the first page as the address without a query', () => {
    expect(canonicalPageUrl('/cg/pony?page=1')).toMatch(/\/cg\/pony$/);
  });
});
