import { describe, expect, it } from 'vitest';

import { toPublicUrl } from 'src/utils/public-url';

describe('toPublicUrl', () => {
  it('sends visitors to https', () => {
    expect(toPublicUrl('http://api.mlpvector.club')).toBe('https://api.mlpvector.club');
    expect(toPublicUrl('http://api.mlpvector.club/docs')).toBe('https://api.mlpvector.club/docs');
  });

  it('leaves https and local development hosts alone', () => {
    expect(toPublicUrl('https://api.mlpvector.club')).toBe('https://api.mlpvector.club');
    expect(toPublicUrl('http://localhost:8000')).toBe('http://localhost:8000');
    expect(toPublicUrl('http://127.0.0.1:8766')).toBe('http://127.0.0.1:8766');
    expect(toPublicUrl('http://[::1]:8000')).toBe('http://[::1]:8000');
  });

  it('copes with no address at all', () => {
    expect(toPublicUrl(undefined)).toBeUndefined();
  });
});
