/**
 * The old site (Winterchilla, `old.mlpvector.club`) and this one are different origins, so neither localStorage nor a plain cookie is shared between
 * them. The few choices that must apply to both (the privacy notice's dismissal, the opt-out from the visitor statistics) are cookies on the parent
 * domain, with the same name and value on both sites. Anywhere else (a development server, a preview address) the cookie is just for the host.
 */
export const SHARED_COOKIE_DOMAIN = 'mlpvector.club';

export const sharedCookieDomain = (hostname: string): string | undefined =>
  hostname === SHARED_COOKIE_DOMAIN || hostname.endsWith(`.${SHARED_COOKIE_DOMAIN}`) ? SHARED_COOKIE_DOMAIN : undefined;

export const COOKIE_MAX_AGE_DAYS = 400;
export const COOKIE_MAX_AGE_SECONDS = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;

/** The `document.cookie` string for a cookie shared by both sites; Max-Age 0 removes it */
export const buildSharedCookie = (name: string, value: string, maxAgeSeconds: number, hostname: string, secure: boolean): string => {
  const domain = sharedCookieDomain(hostname);
  return `${name}=${value}; Max-Age=${maxAgeSeconds}; Path=/${domain ? `; Domain=${domain}` : ''}; SameSite=Lax${secure ? '; Secure' : ''}`;
};

/** The value of a cookie out of `document.cookie` (or a `Cookie` header), or null */
export const readCookie = (cookieString: string, name: string): string | null => {
  for (const part of cookieString.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
};
