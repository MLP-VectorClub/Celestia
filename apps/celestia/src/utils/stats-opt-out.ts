import { COOKIE_MAX_AGE_DAYS, COOKIE_MAX_AGE_SECONDS, buildSharedCookie, readCookie } from 'src/utils/shared-cookie';

/**
 * Visitors can opt out of the anonymous visitor statistics on the privacy policy page. The choice is a plain persistent cookie (deliberately not
 * HttpOnly, so the page can show and renew it), on the parent domain so that the old site (Winterchilla) honours it too. The websocket server is another
 * host that never sees this cookie, so the browser reads it and says so in the websocket handshake (`auth.optOut`, see `utils/websocket.ts`); that
 * connection then works as usual but is in no statistic.
 */
export const STATS_OPT_OUT_COOKIE = 'mlpvc_stats_optout';
export { COOKIE_MAX_AGE_DAYS };

/** The cookie holds the expiry it asked for (epoch milliseconds), so the page can show it; any other value is not an opt-out */
const optOutExpiry = (cookieString: string): number | null => {
  const value = readCookie(cookieString, STATS_OPT_OUT_COOKIE);
  return value !== null && /^\d+$/.test(value) ? Number(value) : null;
};

export const hasStatsOptOutCookie = (cookieString: string): boolean => optOutExpiry(cookieString) !== null;

export const buildStatsOptOutCookie = (optedOut: boolean, secure: boolean, hostname: string, now = new Date()): string => {
  const value = optedOut ? String(now.getTime() + COOKIE_MAX_AGE_SECONDS * 1000) : '';
  return buildSharedCookie(STATS_OPT_OUT_COOKIE, value, optedOut ? COOKIE_MAX_AGE_SECONDS : 0, hostname, secure);
};

export const isStatsOptedOut = (): boolean => typeof document !== 'undefined' && hasStatsOptOutCookie(document.cookie);

export const setStatsOptOut = (optedOut: boolean): void => {
  const { hostname, protocol } = window.location;
  const secure = protocol === 'https:';
  document.cookie = buildStatsOptOutCookie(optedOut, secure, hostname);
  // The first version of this cookie was only for this host: removing the choice has to remove that one as well
  if (!optedOut) document.cookie = `${STATS_OPT_OUT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
};

/** Starts the 400 days over: called on every page load, so the choice does not expire for someone who keeps visiting */
export const renewStatsOptOut = (): void => {
  if (isStatsOptedOut()) setStatsOptOut(true);
};

/** When the opt-out expires (epoch milliseconds, as the cookie recorded it), or null when the visitor is not opted out */
export const getStatsOptOutExpiry = (): number | null => (typeof document === 'undefined' ? null : optOutExpiry(document.cookie));
