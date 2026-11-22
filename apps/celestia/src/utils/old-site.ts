/** The previous version of the site (Winterchilla), still available read-only */
export const OLD_SITE_URL = 'https://old.mlpvector.club';

/** The same page on the old site: its addresses follow the ones of this site closely, so the path is kept (a missing page there answers 404) */
export const oldSiteUrl = (path: string): string => `${OLD_SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
