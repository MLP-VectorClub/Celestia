import { describe, expect, it } from 'vitest';

import { THEME_COOKIE, colorSchemeContent, parseTheme, serializeThemeCookie } from 'src/utils/theme';

describe('parseTheme', () => {
  it('is system without a cookie', () => {
    expect(parseTheme(undefined)).toBe('system');
    expect(parseTheme('')).toBe('system');
    expect(parseTheme('a=b; c=d')).toBe('system');
  });

  it('reads an explicit choice among other cookies', () => {
    expect(parseTheme(`${THEME_COOKIE}=dark`)).toBe('dark');
    expect(parseTheme(`XSRF-TOKEN=abc; ${THEME_COOKIE}=light; other=1`)).toBe('light');
  });

  it('treats unknown values as system', () => {
    expect(parseTheme(`${THEME_COOKIE}=purple`)).toBe('system');
    expect(parseTheme(`${THEME_COOKIE}=`)).toBe('system');
    expect(parseTheme(`${THEME_COOKIE}=system`)).toBe('system');
    expect(parseTheme(`x${THEME_COOKIE}=dark`)).toBe('system');
  });
});

describe('serializeThemeCookie', () => {
  it('keeps an explicit choice for a year', () => {
    expect(serializeThemeCookie('dark')).toBe(`${THEME_COOKIE}=dark; Path=/; SameSite=Lax; Max-Age=31536000`);
  });

  it('adds Secure when asked', () => {
    expect(serializeThemeCookie('light', true)).toContain('; Secure;');
  });

  it('removes the cookie for system', () => {
    expect(serializeThemeCookie('system')).toBe(`${THEME_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`);
  });

  it('round-trips through parseTheme', () => {
    for (const choice of ['light', 'dark'] as const) {
      expect(parseTheme(serializeThemeCookie(choice).split(';')[0])).toBe(choice);
    }
  });
});

describe('colorSchemeContent', () => {
  it('lets the device decide for system', () => {
    expect(colorSchemeContent('system')).toBe('light dark');
    expect(colorSchemeContent('dark')).toBe('dark');
    expect(colorSchemeContent('light')).toBe('light');
  });
});
