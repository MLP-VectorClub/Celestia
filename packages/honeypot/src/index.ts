import type { NextRequest, NextResponse } from 'next/server';

import { createDecoys } from './decoys';
import { compileHoneypots } from './patterns';
import type { TrapSpec } from './patterns';
import { createHoneypotProxy } from './proxy';
import { buildRobotsTxt } from './robots';
import { createSessionChecker } from './session-block';

export { compileHoneypots } from './patterns';
export type { CompiledHoneypots, TrapMatch, TrapSpec } from './patterns';
export type { DecoyName } from './decoys';
export { buildRobotsTxt } from './robots';
export { createSessionChecker } from './session-block';
export type { SessionChecker, SessionCheckerOptions } from './session-block';

export interface HoneypotOptions {
  /**
   * The paths that are traps (see `compileHoneypots` for the globs), all of them compiled into one regular expression right here. A trap can name a
   * `decoy` to answer with a mock page or file instead of the plain refusal
   */
  traps: readonly (string | TrapSpec)[];
  /** What the mock pages call the site */
  siteName?: string;
  /** The address of Luna, which keeps the flag in the session row of its database */
  apiHost: string;
  /** The front end's own address, sent as `Referer` (Luna accepts session cookies only from requests that come from the front end) */
  appHost?: string;
  /** The name of Luna's session cookie, `luna_session` unless its `SESSION_COOKIE` says otherwise */
  sessionCookie?: string;
}

export interface Honeypot {
  /** For the app's `proxy.ts`: the refusal for a trap and for a flagged session, `null` for everybody else */
  proxy: (request: NextRequest) => Promise<NextResponse | null>;
  /** The name of the trap a path belongs to, `null` for any other path */
  match: (pathname: string) => string | null;
  /** The `Disallow:` lines for robots.txt */
  robotsLines: string[];
  /** A robots.txt with the app's own `rules` (lines after `User-agent: *`) and the traps */
  robotsTxt: (options: { comment?: string; rules: string[] }) => string;
}

/** Everything the honeypots need, set up once when the server process starts */
export const createHoneypot = ({
  traps,
  siteName = 'Website',
  apiHost,
  appHost,
  sessionCookie = 'luna_session',
}: HoneypotOptions): Honeypot => {
  const honeypots = compileHoneypots(traps);
  // Built once, here: the secrets in the decoys are generated now and stay the same until the server restarts
  const sessions = createSessionChecker({ apiHost, appHost, sessionCookie });
  return {
    proxy: createHoneypotProxy({
      apiHost,
      appHost,
      sessionCookie,
      honeypots,
      sessions,
      decoys: createDecoys(siteName, `${appHost ?? ''}/.well-known/security.txt`),
    }),
    match: (pathname) => honeypots.match(pathname)?.name ?? null,
    robotsLines: honeypots.robotsLines,
    robotsTxt: ({ comment, rules }) => buildRobotsTxt({ comment, rules, honeypotLines: honeypots.robotsLines }),
  };
};
