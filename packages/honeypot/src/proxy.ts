import { NextRequest, NextResponse } from 'next/server';

import { decoyHeaders } from './decoys';
import type { Decoy } from './decoys';
import type { CompiledHoneypots } from './patterns';
import type { SessionChecker } from './session-block';

export interface HoneypotProxyOptions {
  /** The address of Luna */
  apiHost: string;
  appHost?: string;
  sessionCookie: string;
  honeypots: CompiledHoneypots;
  sessions: SessionChecker;
  /** What answers the traps that name a decoy (anything else, or a name nobody built, gets the plain refusal) */
  decoys?: Record<string, Decoy>;
}

const ASK_TIMEOUT_MS = 1500;

const refusal = () =>
  new NextResponse('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

/** The visitor's address as the reverse proxy in front of Next.js reports it, which the API needs for its logs and throttling */
const visitorAddress = (headers: Headers) =>
  (headers.get('x-real-ip') || headers.get('x-forwarded-for') || '').split(',')[0].trim() || undefined;

/**
 * The routing step of the honeypots, for the app's `proxy.ts`: answers with the refusal for a trap and for a visitor whose session touched one,
 * `null` for everybody else
 */
export const createHoneypotProxy = ({ apiHost, appHost, sessionCookie, honeypots, sessions, decoys = {} }: HoneypotProxyOptions) => {
  /**
   * A trap was asked for: Luna flags the session (keeping it in the session row of its database, and starting one for a visitor who has none), and
   * the session cookie it answers with goes back to the visitor, so the next request is known. Luna not answering changes nothing for the visitor,
   * who gets the refusal either way
   */
  const springTrap = async (request: NextRequest, trap: { name: string; decoy?: string }): Promise<NextResponse> => {
    const decoy = trap.decoy ? decoys[trap.decoy] : undefined;
    // The visitor is flagged either way, a decoy only gives them something to read first
    const response = decoy ? new NextResponse(decoy.body, { status: 200, headers: decoyHeaders(decoy) }) : refusal();
    const address = visitorAddress(request.headers);
    const session = request.cookies.get(sessionCookie)?.value;
    // Files do not set cookies: nothing to flag a visitor with when they have no session, and nothing to hand back when they do
    const quiet = decoy?.cookies === false;
    if (quiet && !session) {
      console.info(
        `[honeypot] ${trap.name} asked for by ${address ?? 'an unknown address'} (${request.headers.get('user-agent') ?? 'no user agent'}), no session to flag`
      );
      return response;
    }
    try {
      const luna = await fetch(`${apiHost}/honeypot/${trap.name}`, {
        headers: {
          ...(appHost ? { referer: appHost } : {}),
          'user-agent': request.headers.get('user-agent') ?? '',
          ...(session ? { cookie: `${sessionCookie}=${session}` } : {}),
          ...(address ? { 'x-forwarded-for': address } : {}),
        },
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
      });
      const cookies = quiet ? [] : luna.headers.getSetCookie();
      cookies.forEach((cookie) => response.headers.append('set-cookie', cookie));
      // The session of the visitor is the one the answer started, or the one they sent
      const started = cookies.map((cookie) => cookie.match(new RegExp(`^${sessionCookie}=([^;]*)`))?.[1]).find(Boolean);
      const flagged = started ? decodeURIComponent(started) : session;
      if (flagged) sessions.markBlocked(flagged);
    } catch {
      /* nothing to flag the session with */
    }
    return response;
  };

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const trap = honeypots.match(request.nextUrl.pathname);
    if (trap) return springTrap(request, trap);
    if (await sessions.isBlocked(request.cookies)) return refusal();
    return null;
  };
};
