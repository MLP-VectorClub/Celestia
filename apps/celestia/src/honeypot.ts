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
  { glob: '/phpmyadmin', decoy: 'phpmyadmin-login' },
  { glob: '/phpmyadmin/**', decoy: 'phpmyadmin-login' },
  { glob: '/pma', decoy: 'phpmyadmin-login' },
];

/**
 * The name of Luna's session cookie: the same `SESSION_COOKIE` in the `.env` of both applications. With the wrong name no session is ever found, and
 * nobody who touches a trap stays blocked, so a missing one is said out loud when the server starts (and Luna's default for this site is used)
 */
const SESSION_COOKIE = (() => {
  if (process.env.SESSION_COOKIE) return process.env.SESSION_COOKIE;
  console.warn('[honeypot] SESSION_COOKIE is not set, using mlp_vector_club_session: set it to the SESSION_COOKIE of Luna');
  return 'mlp_vector_club_session';
})();

/** Set up once when the server starts: the globs are compiled into a single regular expression and the decoys built here */
export const honeypot = createHoneypot({
  traps: HONEYPOT_TRAPS,
  siteName: APP_NAME,
  // The server runs as several workers (pm2 cluster mode): without something they share, each would invent its own secrets, and a scanner sent from one
  // to the next would read different files. The build id is the same in all of them and changes with every deploy; HONEYPOT_SEED, when set, keeps the
  // values across deploys
  seed: process.env.HONEYPOT_SEED || process.env.NEXT_PUBLIC_BUILD_ID || undefined,
  apiHost: API_HOST,
  appHost: APP_HOST,
  sessionCookie: SESSION_COOKIE,
});
