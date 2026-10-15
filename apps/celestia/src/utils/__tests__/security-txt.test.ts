import { describe, expect, it } from 'vitest';

import { HONEYPOT_TRAPS } from 'src/honeypot';
import { buildSecurityTxt, securityTxtExpiry } from 'src/pages/api/security';

const txt = buildSecurityTxt(new Date('2026-10-15T12:00:00.000Z'));

describe('security.txt', () => {
  it('expires on the last day of the month eleven months ahead, the same value all month', () => {
    expect(buildSecurityTxt(new Date('2026-10-01T00:00:00Z'))).toContain('Expires: 2027-09-30T23:59:59Z');
    expect(buildSecurityTxt(new Date('2026-10-31T23:59:59Z'))).toContain('Expires: 2027-09-30T23:59:59Z');
    expect(buildSecurityTxt(new Date('2026-11-01T00:00:00Z'))).toContain('Expires: 2027-10-31T23:59:59Z');
    expect(buildSecurityTxt(new Date('2027-01-31T12:00:00Z'))).toContain('Expires: 2027-12-31T23:59:59Z');
    // Never a year or more away
    const now = new Date('2026-10-31T23:59:59Z');
    const expires = new Date(securityTxtExpiry(now));
    expect(expires.getTime() - now.getTime()).toBeLessThan(365 * 24 * 3600 * 1000);
  });

  it('has the contact of the site and an expiry less than a year ahead, the way RFC 9116 wants them', () => {
    expect(txt).toMatch(/^Contact: mailto:mail@went\.tf$/m);
    expect(txt).toMatch(/^Expires: 2027-09-30T23:59:59Z$/m);
    expect(txt).toMatch(/^Canonical: .*\/\.well-known\/security\.txt$/m);
  });

  it('lists every honeypot, so the note cannot fall behind the traps', () => {
    HONEYPOT_TRAPS.forEach(({ glob }) => expect(txt).toContain(`#   ${glob}\n`));
  });

  it('says what a report about one gets', () => {
    expect(txt).toContain('Never Gonna Give You Up');
    expect(txt).toContain('Rick Astley');
    expect(txt).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('keeps the note in comments (a line that is not one would be read as a field)', () => {
    const lines = txt.split('\n').filter(Boolean);
    const fields = lines.filter((line) => !line.startsWith('#'));
    expect(fields.every((line) => /^(Contact|Expires|Preferred-Languages|Canonical): /.test(line))).toBe(true);
  });
});
