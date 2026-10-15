import { createHoneypot } from '@mlp-vectorclub/honeypot';
import { API_HOST, APP_HOST } from 'src/config';

/**
 * Paths that scanners ask for and nobody else has a reason to: the pages of software the site does not run, secrets people leave lying around. Each
 * is listed as disallowed in robots.txt (`pages/api/robots.ts`), so only what ignores it springs one. See the package for the glob syntax
 */
export const HONEYPOT_GLOBS = ['/.env', '/wp-admin', '/wp-admin/**', '/admin.php'];

/** Set up once when the server starts: the globs are compiled into a single regular expression here */
export const honeypot = createHoneypot({
  globs: HONEYPOT_GLOBS,
  apiHost: API_HOST,
  appHost: APP_HOST,
  sessionCookie: process.env.LUNA_SESSION_COOKIE || undefined,
});
