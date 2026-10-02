import { describe, expect, it } from 'vitest';

import { parseListPage, parseSharedPostId } from 'src/utils/post-share';

describe('parseSharedPostId', () => {
  it('reads base 36 IDs', () => {
    expect(parseSharedPostId('1')).toBe(1);
    expect(parseSharedPostId('z')).toBe(35);
    expect(parseSharedPostId('1Z')).toBe(71);
  });

  it('rejects zero, huge values and anything that is not alphanumeric', () => {
    ['0', 'zzzzzzzzzz', '', '-1', '1.5', 'a b', '12/3'].forEach((value) => expect(parseSharedPostId(value)).toBeNull());
  });
});

describe('parseListPage', () => {
  it('defaults to the first page', () => {
    expect(parseListPage(undefined)).toBe(1);
    expect(parseListPage('x')).toBe(1);
    expect(parseListPage('0')).toBe(1);
  });

  it('reads the page number, also from a catch-all array', () => {
    expect(parseListPage('4')).toBe(4);
    expect(parseListPage(['7'])).toBe(7);
  });
});
