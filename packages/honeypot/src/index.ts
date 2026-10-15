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
  /**
   * Where the random values of the decoys (the secrets in the `.env` and so on) come from. Without one every process makes its own, and a server that
   * runs as several workers hands out a different file depending on which one answers. With the same seed they all make the same values: use
   * something every worker has and a new launch does not (the build id), or a secret kept in the environment to keep them across deploys
   */
  seed?: string;
  /** What the mock pages call the site */
  siteName?: string;
  /** The address of Luna, which keeps the flag in the session row of its database */
  apiHost: string;
  /** The front end's own address, sent as `Referer` (Luna accepts session cookies only from requests that come from the front end) */
  appHost?: string;
  /** The name of Luna's session cookie (its `session.cookie`, `SESSION_COOKIE` in its `.env`), `luna_session` when not given: this has to be right, so pass the same variable */
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
  seed,
  apiHost,
  appHost,
  sessionCookie = 'luna_session',
}: HoneypotOptions): Honeypot => {
  const honeypots = compileHoneypots(traps);
  // Built once, here: the secrets in the decoys are made now and stay the same until the server restarts (and, with a seed, in every worker)
  const sessions = createSessionChecker({ apiHost, appHost, sessionCookie });
  return {
    proxy: createHoneypotProxy({
      apiHost,
      appHost,
      sessionCookie,
      honeypots,
      sessions,
      decoys: createDecoys(siteName, `${appHost ?? ''}/.well-known/security.txt`, seed),
    }),
    match: (pathname) => honeypots.match(pathname)?.name ?? null,
    robotsLines: honeypots.robotsLines,
    robotsTxt: ({ comment, rules }) => buildRobotsTxt({ comment, rules, honeypotLines: honeypots.robotsLines }),
  };
};
