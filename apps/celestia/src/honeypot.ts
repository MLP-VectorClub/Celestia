import { type TrapSpec, createHoneypot } from '@mlp-vectorclub/honeypot';
import { API_HOST, APP_HOST, APP_NAME } from 'src/config';

/**
 * Paths that scanners ask for and nobody else has a reason to: the pages of software the site does not run, secrets people leave lying around. Each
 * is listed as disallowed in robots.txt (`pages/api/robots.ts`), so only what ignores it springs one. The most popular ones answer with a mock page
 * or file (`decoy`) before the visitor is refused for good. See the package for the glob syntax
 */
export const HONEYPOT_TRAPS: TrapSpec[] = [
  { glob: '/.env', decoy: 'env' },
  { glob: '/.env.*', decoy: 'env' },
  { glob: '/**/.env', decoy: 'env' },
  { glob: '/.git/config', decoy: 'git-config' },
  { glob: '/wp-login.php', decoy: 'wordpress-login' },
  { glob: '/wp-admin', decoy: 'wordpress-login' },
  { glob: '/wp-admin/**' },
  { glob: '/admin.php' },
  { glob: '/adminer', decoy: 'adminer-login' },
  { glob: '/adminer.php', decoy: 'adminer-login' },
  { glob: '/phpmyadmin', decoy: 'adminer-login' },
  { glob: '/phpmyadmin/**' },
  { glob: '/pma', decoy: 'adminer-login' },
];

/** Set up once when the server starts: the globs are compiled into a single regular expression and the decoys built here */
export const honeypot = createHoneypot({
  traps: HONEYPOT_TRAPS,
  siteName: APP_NAME,
  apiHost: API_HOST,
  appHost: APP_HOST,
  sessionCookie: process.env.LUNA_SESSION_COOKIE || undefined,
});
