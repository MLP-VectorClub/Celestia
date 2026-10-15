export interface SessionCheckerOptions {
  /** The address of Luna, which keeps the flag in the session row of its database */
  apiHost: string;
  /** The name of Luna's session cookie (its `SESSION_COOKIE`) */
  sessionCookie: string;
  /** What to send as `Referer`: Luna only accepts a session cookie from requests that come from the front end */
  appHost?: string;
}

/** How long a session in good standing is believed before Luna is asked again; one that touched a honeypot is believed for a lot longer */
const OK_TTL_MS = 30_000;
const BLOCKED_TTL_MS = 60 * 60_000;
const FAILED_TTL_MS = 5_000;
/** Asking is quick and cheap, but a slow answer must not hold every page up */
const ASK_TIMEOUT_MS = 1500;
const MAX_ENTRIES = 5000;

export interface SessionChecker {
  /** Whether the session was flagged by a honeypot, `false` for a visitor without a session cookie and while Luna cannot be reached */
  isBlocked: (cookies: { get: (name: string) => { value: string } | undefined }) => Promise<boolean>;
  /** Remembers that a session was flagged, for when the answer is already known */
  markBlocked: (session: string) => void;
  /** Forgets every answer */
  clear: () => void;
}

/**
 * Asks Luna, on the server and for the request itself, whether the visitor's session touched a honeypot. Nothing the browser holds, apart from the
 * session, changes the answer. Answers are remembered for a while, so most requests cost nothing; Luna being unreachable counts as "not flagged"
 * (briefly remembered, so a down API does not make every request wait)
 */
export const createSessionChecker = ({ apiHost, sessionCookie, appHost }: SessionCheckerOptions): SessionChecker => {
  const answers = new Map<string, { blocked: boolean; until: number }>();

  const remember = (session: string, blocked: boolean, ttl: number) => {
    if (answers.size >= MAX_ENTRIES) {
      const now = Date.now();
      answers.forEach((entry, key) => entry.until <= now && answers.delete(key));
      // Still full of live entries: start over rather than grow
      if (answers.size >= MAX_ENTRIES) answers.clear();
    }
    answers.set(session, { blocked, until: Date.now() + ttl });
  };

  return {
    clear: () => answers.clear(),
    markBlocked: (session) => remember(session, true, BLOCKED_TTL_MS),
    isBlocked: async (cookies) => {
      const session = cookies.get(sessionCookie)?.value;
      if (!session) return false;

      const known = answers.get(session);
      if (known && known.until > Date.now()) return known.blocked;

      try {
        const response = await fetch(`${apiHost}/internal/session-status`, {
          headers: { cookie: `${sessionCookie}=${session}`, accept: 'application/json', ...(appHost ? { referer: appHost } : {}) },
          cache: 'no-store',
          redirect: 'manual',
          signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
        });
        const blocked = response.status === 403;
        remember(session, blocked, blocked ? BLOCKED_TTL_MS : OK_TTL_MS);
        return blocked;
      } catch {
        remember(session, false, FAILED_TTL_MS);
        return false;
      }
    },
  };
};
