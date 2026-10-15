import { adminerLogin } from './adminer';
import { VISITORS_MOM, VISITORS_MOM_LBS, envFile } from './env';
import { gitConfig } from './git';
import { momsWeightOf } from './moms';
import { decoyCsp } from './page';
import type { HtmlPage } from './page';
import { phpmyadminLogin } from './phpmyadmin';
import { randomSecrets } from './secrets';
import { LOST_PASSWORD_ACTIONS, wordpressLogin, wordpressLostPassword } from './wordpress';

export interface Decoy {
  body: string;
  contentType: string;
  /** The Content-Security-Policy that lets a page load its font, stylesheet and script (none for plain text) */
  csp?: string;
  /** Fills in what depends on who asks (the body is a template then), and keeps the answer out of shared caches */
  render?: (visitor: { address?: string }) => string;
  /** Picks another decoy for the same path from the query of the request (the address is part of what shared caches key on) */
  select?: (search: URLSearchParams) => Decoy | undefined;
  /** Replaces the default `Cache-Control` of the decoys */
  cacheControl?: string;
  /**
   * Whether answering may set cookies (the default). Turn it off for a file that should look like a plain one: a visitor without a session is then not
   * given one (so nothing is flagged for them, Luna is not even asked), and one with a session is flagged without getting any cookie back. No decoy does
   * at the moment: a trap that flags nobody who has no session was not worth looking like a file
   */
  cookies?: boolean;
}

/** The names a trap can give as its `decoy` */
export type DecoyName = 'env' | 'wordpress-login' | 'adminer-login' | 'phpmyadmin-login' | 'git-config';

/**
 * Builds every decoy, once (so the secrets in them are generated when the server starts and stay the same for as long as it runs: a scanner that
 * asks twice must see the same file). Static content, nothing here depends on the request
 */
const htmlDecoy = ({ html, script }: HtmlPage): Decoy => ({ body: html, contentType: 'text/html; charset=utf-8', csp: decoyCsp(script) });

export const createDecoys = (siteName: string, securityTxtUrl: string, seed?: string): Record<DecoyName, Decoy> => {
  const secrets = randomSecrets(seed);
  const momsWeight = momsWeightOf(secrets.hex(16));
  const fillIn = (template: string, weight: { kg: string; lbs: string }) =>
    template.replace(VISITORS_MOM, weight.kg).replace(VISITORS_MOM_LBS, weight.lbs);
  // Generated once, so the secrets stay the same for every visitor: only the line about their mother changes
  const envTemplate = envFile(secrets, siteName, securityTxtUrl);
  const lostPassword = htmlDecoy(wordpressLostPassword(siteName));
  return {
    env: {
      body: fillIn(envTemplate, momsWeight()),
      contentType: 'text/plain; charset=utf-8',
      render: ({ address }) => fillIn(envTemplate, momsWeight(address)),
      // It has a line that is different for every visitor, so only their own browser may keep it
      cacheControl: 'private, max-age=0',
    },
    'git-config': { body: gitConfig(secrets, siteName), contentType: 'text/plain; charset=utf-8' },
    'wordpress-login': {
      ...htmlDecoy(wordpressLogin(siteName)),
      select: (search) => (LOST_PASSWORD_ACTIONS.includes(search.get('action') ?? '') ? lostPassword : undefined),
    },
    // The hidden tokens of the forms are random and never checked by anything
    'adminer-login': htmlDecoy(adminerLogin(secrets.hex(16))),
    'phpmyadmin-login': htmlDecoy(phpmyadminLogin({ token: secrets.hex(16), session: secrets.hex(16) })),
  };
};

/**
 * Everything about a decoy is static, so shared caches (a CDN in front of the site) may keep it for a month, which is what spares the server the load of
 * the scanners that come back. Browsers may not: a visit that a browser answers from its own cache never reaches the server, and the visitor would not be
 * flagged (somebody who opens a trap, goes away and opens it again a day later would see nothing happen). They ask every time
 */
export const DECOY_CACHE_CONTROL = 'public, max-age=0, s-maxage=2592000';

export const decoyHeaders = (decoy: Decoy): Record<string, string> => ({
  'Content-Type': decoy.contentType,
  'Cache-Control': decoy.cacheControl ?? DECOY_CACHE_CONTROL,
  ...(decoy.csp ? { 'Content-Security-Policy': decoy.csp } : {}),
});
