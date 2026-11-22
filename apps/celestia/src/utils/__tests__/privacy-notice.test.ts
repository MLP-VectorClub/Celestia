import { afterEach, describe, expect, it, vi } from 'vitest';

import { PRIVACY_NOTICE_COOKIE, dismissPrivacyNotice, parseDismissal, readPrivacyNoticeDismissal, shouldShowPrivacyNotice } from 'src/utils/privacy-notice';

const UPDATED = '2026-11-22T00:00:00Z';
const AFTER = Date.parse('2026-11-23T10:00:00Z');
const BEFORE = Date.parse('2026-11-21T10:00:00Z');

describe('shouldShowPrivacyNotice', () => {
  it('is shown until it is dismissed', () => {
    expect(shouldShowPrivacyNotice(null, UPDATED)).toBe(true);
  });

  it('stays away after a dismissal that came after the update', () => {
    expect(shouldShowPrivacyNotice(AFTER, UPDATED)).toBe(false);
    expect(shouldShowPrivacyNotice(Date.parse(UPDATED), UPDATED)).toBe(false);
  });

  it('comes back after an update the visitor has not seen', () => {
    expect(shouldShowPrivacyNotice(BEFORE, UPDATED)).toBe(true);
  });
});

describe('parseDismissal', () => {
  it('reads the time out of the cookie', () => {
    expect(parseDismissal(`a=b; ${PRIVACY_NOTICE_COOKIE}=${AFTER}`)).toBe(AFTER);
  });

  it('ignores anything that is not a time', () => {
    expect(parseDismissal(`${PRIVACY_NOTICE_COOKIE}=garbage`)).toBeNull();
    expect(parseDismissal('a=b')).toBeNull();
  });
});

describe('dismissal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('writes a cookie both sites read, and reads it back', () => {
    const doc = { cookie: '' };
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', { location: { hostname: 'old.mlpvector.club', protocol: 'https:' } });
    dismissPrivacyNotice(new Date(AFTER));
    expect(doc.cookie).toBe(`${PRIVACY_NOTICE_COOKIE}=${AFTER}; Max-Age=34560000; Path=/; Domain=mlpvector.club; SameSite=Lax; Secure`);
    doc.cookie = `${PRIVACY_NOTICE_COOKIE}=${AFTER}`;
    expect(readPrivacyNoticeDismissal()).toBe(AFTER);
  });

  it('lasts until the page closes when cookies are blocked', () => {
    vi.stubGlobal('document', { cookie: '' });
    vi.stubGlobal('window', { location: { hostname: 'localhost', protocol: 'http:' } });
    dismissPrivacyNotice(new Date(AFTER + 1));
    expect(readPrivacyNoticeDismissal()).toBe(AFTER + 1);
  });
});
