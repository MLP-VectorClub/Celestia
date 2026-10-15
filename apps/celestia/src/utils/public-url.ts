/**
 * The address of the API for links people click. Server-side requests use `http://api...` on production on purpose (the name points at the local nginx,
 * whose certificate Node does not trust), but a visitor's browser should go straight to https instead of through a redirect. Local hosts keep http
 */
export const toPublicUrl = <T extends string | undefined>(url: T): T =>
  (typeof url === 'string' ? url.replace(/^http:\/\/(?!localhost|127\.|\[::1\])/, 'https://') : url) as T;
