import { NextRequest, NextResponse } from 'next/server';

import { getCleanRedirectPath } from 'src/utils/clean-url';

/** Set by Luna on whoever touched a honeypot (see `HONEYPOTS` in next.config.js), its session is refused there and so is the rest of the site here */
const BLOCKED_COOKIE = 'blocked';

/** Refuses visitors who touched a honeypot, and sends visitors with a mangled pasted link (trailing `…` or `<`, backslashes, stray characters) to the cleaned URL */
export function proxy(request: NextRequest) {
  if (request.cookies.get(BLOCKED_COOKIE)?.value === '1') {
    return new NextResponse('Forbidden', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const { pathname, search } = request.nextUrl;
  const cleaned = getCleanRedirectPath(pathname + search);
  if (cleaned === null) return NextResponse.next();

  return NextResponse.redirect(new URL(cleaned, request.url), 302);
}

export const config = {
  // Build output and static assets never carry pasted links
  matcher: ['/((?!_next/|favicon.ico).*)'],
};
