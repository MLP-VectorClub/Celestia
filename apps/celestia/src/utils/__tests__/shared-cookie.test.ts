import { describe, expect, it } from 'vitest';

import { buildSharedCookie, readCookie, sharedCookieDomain } from 'src/utils/shared-cookie';

describe('sharedCookieDomain', () => {
  it('is the parent domain for the club\'s sites, so the old site sees the cookie too', () => {
    expect(sharedCookieDomain('mlpvector.club')).toBe('mlpvector.club');
    expect(sharedCookieDomain('old.mlpvector.club')).toBe('mlpvector.club');
  });

  it('is nothing elsewhere, and does not match look-alike hosts', () => {
    expect(sharedCookieDomain('localhost')).toBeUndefined();
    expect(sharedCookieDomain('evilmlpvector.club')).toBeUndefined();
    expect(sharedCookieDomain('mlpvector.club.example.com')).toBeUndefined();
  });
});

describe('buildSharedCookie', () => {
  it('sets the domain, SameSite and Secure', () => {
    expect(buildSharedCookie('a', '1', 60, 'mlpvector.club', true)).toBe('a=1; Max-Age=60; Path=/; Domain=mlpvector.club; SameSite=Lax; Secure');
  });

  it('is only for the host where there is no shared domain', () => {
    expect(buildSharedCookie('a', '1', 60, 'localhost', false)).toBe('a=1; Max-Age=60; Path=/; SameSite=Lax');
  });
});

describe('readCookie', () => {
  it('finds a cookie by its exact name', () => {
    expect(readCookie('x=1; a=2; xa=3', 'a')).toBe('2');
    expect(readCookie('x=1', 'a')).toBeNull();
  });
});
