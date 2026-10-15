import { describe, expect, it } from 'vitest';

import { HONEYPOT_TRAPS } from 'src/honeypot';
import { buildSecurityTxt } from 'src/pages/api/security';

const txt = buildSecurityTxt(new Date('2026-10-15T12:00:00.000Z'));

describe('security.txt', () => {
  it('has the contact of the site and a year of validity, the way RFC 9116 wants them', () => {
    expect(txt).toMatch(/^Contact: mailto:mail@went\.tf$/m);
    expect(txt).toMatch(/^Expires: 2027-10-15T12:00:00\.000Z$/m);
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
