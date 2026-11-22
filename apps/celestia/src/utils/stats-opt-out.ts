/**
 * Visitors can opt out of the anonymous visitor statistics on the privacy policy page. The choice is a plain persistent cookie (deliberately not
 * HttpOnly, so the page can show and renew it). The websocket server is another host that never sees this cookie, so the browser reads it and says
 * so in the websocket handshake (`auth.optOut`, see `utils/websocket.ts`); that connection then works as usual but is in no statistic.
 */
export const STATS_OPT_OUT_COOKIE = 'mlpvc_stats_optout';

/** The longest a cookie can last in Chrome and Firefox. It is written again on every page load (see `renewStatsOptOut`), which starts the period over */
export const COOKIE_MAX_AGE_DAYS = 400;
const COOKIE_MAX_AGE_SECONDS = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;

/** The cookie holds the expiry it asked for (epoch milliseconds), so the page can show it; any other value is not an opt-out */
const optOutExpiry = (cookieString: string): number | null => {
  for (const part of cookieString.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== STATS_OPT_OUT_COOKIE) continue;
    const value = rest.join('=');
    return /^\d+$/.test(value) ? Number(value) : null;
  }
  return null;
};

export const hasStatsOptOutCookie = (cookieString: string): boolean => optOutExpiry(cookieString) !== null;

export const buildStatsOptOutCookie = (optedOut: boolean, secure: boolean, now = new Date()): string => {
  const value = optedOut ? String(now.getTime() + COOKIE_MAX_AGE_SECONDS * 1000) : '';
  return `${STATS_OPT_OUT_COOKIE}=${value}; Max-Age=${optedOut ? COOKIE_MAX_AGE_SECONDS : 0}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
};

export const isStatsOptedOut = (): boolean => typeof document !== 'undefined' && hasStatsOptOutCookie(document.cookie);

export const setStatsOptOut = (optedOut: boolean): void => {
  document.cookie = buildStatsOptOutCookie(optedOut, window.location.protocol === 'https:');
};

/** Starts the 400 days over: called on every page load, so the choice does not expire for someone who keeps visiting */
export const renewStatsOptOut = (): void => {
  if (isStatsOptedOut()) setStatsOptOut(true);
};

/** When the opt-out expires (epoch milliseconds, as the cookie recorded it), or null when the visitor is not opted out */
export const getStatsOptOutExpiry = (): number | null => (typeof document === 'undefined' ? null : optOutExpiry(document.cookie));
