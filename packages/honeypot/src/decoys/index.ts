import { adminerLogin } from './adminer';
import { envFile } from './env';
import { gitConfig } from './git';
import { decoyCsp } from './page';
import type { HtmlPage } from './page';
import { randomSecrets } from './secrets';
import { wordpressLogin } from './wordpress';

export interface Decoy {
  body: string;
  contentType: string;
  /** The Content-Security-Policy that lets a page load its font, stylesheet and script (none for plain text) */
  csp?: string;
}

/** The names a trap can give as its `decoy` */
export type DecoyName = 'env' | 'wordpress-login' | 'adminer-login' | 'git-config';

/**
 * Builds every decoy, once (so the secrets in them are generated when the server starts and stay the same for as long as it runs: a scanner that
 * asks twice must see the same file). Static content, nothing here depends on the request
 */
const htmlDecoy = ({ html, script }: HtmlPage): Decoy => ({ body: html, contentType: 'text/html; charset=utf-8', csp: decoyCsp(script) });

export const createDecoys = (siteName: string): Record<DecoyName, Decoy> => {
  const secrets = randomSecrets();
  return {
    env: { body: envFile(secrets, siteName), contentType: 'text/plain; charset=utf-8' },
    'git-config': { body: gitConfig(secrets, siteName), contentType: 'text/plain; charset=utf-8' },
    'wordpress-login': htmlDecoy(wordpressLogin(siteName)),
    'adminer-login': htmlDecoy(adminerLogin()),
  };
};

/**
 * Everything about a decoy is static, so shared caches and browsers may keep it for good: whoever asks again does not reach the server at all (which
 * also means no new session gets flagged for that visit, the price of keeping the load down)
 */
export const DECOY_CACHE_CONTROL = 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=604800, immutable';

export const decoyHeaders = (decoy: Decoy): Record<string, string> => ({
  'Content-Type': decoy.contentType,
  'Cache-Control': DECOY_CACHE_CONTROL,
  ...(decoy.csp ? { 'Content-Security-Policy': decoy.csp } : {}),
});
