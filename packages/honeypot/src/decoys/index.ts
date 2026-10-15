import { adminerLogin } from './adminer';
import { VISITORS_MOM, envFile } from './env';
import { gitConfig } from './git';
import { momsWeightOf } from './moms';
import { decoyCsp } from './page';
import type { HtmlPage } from './page';
import { randomSecrets } from './secrets';
import { wordpressLogin } from './wordpress';

export interface Decoy {
  body: string;
  contentType: string;
  /** The Content-Security-Policy that lets a page load its font, stylesheet and script (none for plain text) */
  csp?: string;
  /** Fills in what depends on who asks (the body is a template then), and keeps the answer out of shared caches */
  render?: (visitor: { address?: string }) => string;
  /** Replaces the default `Cache-Control` of the decoys */
  cacheControl?: string;
  /**
   * Whether answering may set cookies (the default). A file that is just lying around does not: setting one would give the trap away, so a visitor
   * without a session is not given one (and Luna is not asked to start one), and one with a session is flagged without getting any cookie back
   */
  cookies?: boolean;
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
  const momsWeightKg = momsWeightOf(secrets.hex(16));
  // Generated once, so the secrets stay the same for every visitor: only the line about their mother changes
  const envTemplate = envFile(secrets, siteName);
  return {
    env: {
      body: envTemplate.replace(VISITORS_MOM, momsWeightKg()),
      contentType: 'text/plain; charset=utf-8',
      cookies: false,
      render: ({ address }) => envTemplate.replace(VISITORS_MOM, momsWeightKg(address)),
      // It has a line that is different for every visitor, so only their own browser may keep it
      cacheControl: 'private, max-age=86400',
    },
    'git-config': { body: gitConfig(secrets, siteName), contentType: 'text/plain; charset=utf-8', cookies: false },
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
  'Cache-Control': decoy.cacheControl ?? DECOY_CACHE_CONTROL,
  ...(decoy.csp ? { 'Content-Security-Policy': decoy.csp } : {}),
});
