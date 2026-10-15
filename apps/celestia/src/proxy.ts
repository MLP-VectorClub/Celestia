import { NextRequest, NextResponse } from 'next/server';

import { honeypot } from 'src/honeypot';
import { getCleanRedirectPath } from 'src/utils/clean-url';

/**
 * Refuses the visitors of the honeypots (see `src/honeypot.ts` and the honeypot package), and sends visitors with a mangled pasted link (trailing `…` or `<`, backslashes, stray
 * characters) to the cleaned URL
 */
export async function proxy(request: NextRequest) {
  const refused = await honeypot.proxy(request);
  if (refused) return refused;

  const { pathname, search } = request.nextUrl;
  const cleaned = getCleanRedirectPath(pathname + search);
  if (cleaned === null) return NextResponse.next();

  return NextResponse.redirect(new URL(cleaned, request.url), 302);
}

export const config = {
  // Build output and static assets never carry pasted links
  matcher: ['/((?!_next/|favicon.ico).*)'],
};
