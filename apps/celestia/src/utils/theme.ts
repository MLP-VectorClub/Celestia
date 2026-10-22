/**
 * The visitor's color theme. "System" is the default and has no cookie: the page then follows the device through `prefers-color-scheme`
 * (see `_theme.scss`), which works without JavaScript. An explicit choice is kept in a cookie so the server can put it on `<html>` right away.
 */
export const THEME_COOKIE = 'mlpvc-theme';
export const THEME_CHOICES = ['system', 'light', 'dark'] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
export type ExplicitTheme = Exclude<ThemeChoice, 'system'>;

const ONE_YEAR = 60 * 60 * 24 * 365;

export const isExplicitTheme = (value: unknown): value is ExplicitTheme => value === 'light' || value === 'dark';

/** Reads the theme out of a `Cookie` header (or `document.cookie`); a missing or unknown value is "system" */
export function parseTheme(cookieHeader: string | undefined | null): ThemeChoice {
  for (const part of (cookieHeader ?? '').split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== THEME_COOKIE) continue;
    const value = rest.join('=');
    return isExplicitTheme(value) ? value : 'system';
  }
  return 'system';
}

/** The `Set-Cookie` / `document.cookie` string for a choice; "system" removes the cookie */
export function serializeThemeCookie(choice: ThemeChoice, secure = false): string {
  const attributes = ['Path=/', 'SameSite=Lax'];
  if (secure) attributes.push('Secure');
  if (isExplicitTheme(choice)) return `${THEME_COOKIE}=${choice}; ${attributes.join('; ')}; Max-Age=${ONE_YEAR}`;
  return `${THEME_COOKIE}=; ${attributes.join('; ')}; Max-Age=0`;
}

/** What `<meta name="color-scheme">` says, so form controls and scrollbars match before the stylesheet applies */
export const colorSchemeContent = (choice: ThemeChoice): string => (isExplicitTheme(choice) ? choice : 'light dark');
