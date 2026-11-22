import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  COOKIE_MAX_AGE_DAYS,
  STATS_OPT_OUT_COOKIE,
  buildStatsOptOutCookie,
  getStatsOptOutExpiry,
  hasStatsOptOutCookie,
  isStatsOptedOut,
  renewStatsOptOut,
  setStatsOptOut,
} from 'src/utils/stats-opt-out';

const DAY = 24 * 60 * 60 * 1000;

describe('hasStatsOptOutCookie', () => {
  it('is false without the cookie', () => {
    expect(hasStatsOptOutCookie('')).toBe(false);
    expect(hasStatsOptOutCookie('a=b; mlpvc-theme=dark')).toBe(false);
  });

  it('finds the cookie among others', () => {
    expect(hasStatsOptOutCookie(`a=b; ${STATS_OPT_OUT_COOKIE}=1900000000000; c=d`)).toBe(true);
  });

  it('only accepts a numeric expiry, so an empty or made-up value is not an opt-out', () => {
    expect(hasStatsOptOutCookie(`${STATS_OPT_OUT_COOKIE}=`)).toBe(false);
    expect(hasStatsOptOutCookie(`${STATS_OPT_OUT_COOKIE}=yes`)).toBe(false);
    expect(hasStatsOptOutCookie(`x${STATS_OPT_OUT_COOKIE}=1`)).toBe(false);
  });
});

describe('buildStatsOptOutCookie', () => {
  const now = new Date('2026-11-22T12:00:00Z');

  it('lasts 400 days and records the expiry as its value', () => {
    expect(buildStatsOptOutCookie(true, false, now)).toBe(
      `${STATS_OPT_OUT_COOKIE}=${now.getTime() + COOKIE_MAX_AGE_DAYS * DAY}; Max-Age=${COOKIE_MAX_AGE_DAYS * 24 * 60 * 60}; Path=/; SameSite=Lax`
    );
  });

  it('adds Secure when asked', () => {
    expect(buildStatsOptOutCookie(true, true, now)).toMatch(/; Secure$/);
  });

  it('removes the cookie when the choice is undone', () => {
    expect(buildStatsOptOutCookie(false, true, now)).toBe(`${STATS_OPT_OUT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax; Secure`);
  });
});

describe('with a document', () => {
  afterEach(() => vi.unstubAllGlobals());

  const fakeDocument = (cookie: string) => {
    const doc = { cookie };
    vi.stubGlobal('document', doc);
    return doc;
  };

  it('reads the choice and its expiry', () => {
    fakeDocument(`${STATS_OPT_OUT_COOKIE}=1900000000000`);
    expect(isStatsOptedOut()).toBe(true);
    expect(getStatsOptOutExpiry()).toBe(1900000000000);
    fakeDocument('');
    expect(isStatsOptedOut()).toBe(false);
    expect(getStatsOptOutExpiry()).toBeNull();
  });

  it('writes the cookie, over https only with Secure', () => {
    vi.stubGlobal('window', { location: { protocol: 'https:' } });
    const doc = fakeDocument('');
    setStatsOptOut(true);
    expect(doc.cookie).toContain('; Secure');
  });

  it('renews an existing opt-out and leaves a visitor who has none alone', () => {
    vi.stubGlobal('window', { location: { protocol: 'http:' } });
    const none = fakeDocument('a=b');
    renewStatsOptOut();
    expect(none.cookie).toBe('a=b');

    const opted = fakeDocument(`${STATS_OPT_OUT_COOKIE}=1`);
    renewStatsOptOut();
    expect(opted.cookie).toMatch(new RegExp(`^${STATS_OPT_OUT_COOKIE}=\\d{13}; Max-Age=`));
  });
});
