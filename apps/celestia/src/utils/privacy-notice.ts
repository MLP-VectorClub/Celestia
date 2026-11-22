import { COOKIE_MAX_AGE_SECONDS, buildSharedCookie, readCookie } from 'src/utils/shared-cookie';

/**
 * The notice about the privacy policy (the visitor statistics and how to opt out) is shown until it is dismissed. The time of the dismissal is kept in a
 * cookie on the parent domain, so dismissing it here also dismisses it on the old site (Winterchilla) and the other way around. A later update of the
 * policy (a newer `PRIVACY_UPDATE_DATE_ISO`) shows it again to everyone, including those who dismissed it before that.
 */
export const PRIVACY_NOTICE_COOKIE = 'mlpvc_privacy_notice';

/** When the privacy policy last changed in a way visitors should hear about. Raise it together with `privacyPolicy.lead` in the policy's text (and on the old site) */
export const PRIVACY_UPDATE_DATE_ISO = '2026-11-22T00:00:00Z';

/** `dismissedAt` is the time of the dismissal in epoch milliseconds, as the cookie holds it */
export const shouldShowPrivacyNotice = (dismissedAt: number | null, updatedAtIso: string = PRIVACY_UPDATE_DATE_ISO): boolean =>
  dismissedAt === null || !(dismissedAt >= Date.parse(updatedAtIso));

// A dismissal that could not be stored (cookies blocked) lasts until the page closes
let memory: number | null = null;

export const parseDismissal = (cookieString: string): number | null => {
  const value = readCookie(cookieString, PRIVACY_NOTICE_COOKIE);
  return value !== null && /^\d+$/.test(value) ? Number(value) : null;
};

/** When the notice was dismissed (epoch milliseconds) on either site, or null */
export const readPrivacyNoticeDismissal = (): number | null =>
  (typeof document === 'undefined' ? null : parseDismissal(document.cookie)) ?? memory;

export const dismissPrivacyNotice = (now = new Date()): void => {
  memory = now.getTime();
  document.cookie = buildSharedCookie(PRIVACY_NOTICE_COOKIE, String(memory), COOKIE_MAX_AGE_SECONDS, window.location.hostname, window.location.protocol === 'https:');
};
