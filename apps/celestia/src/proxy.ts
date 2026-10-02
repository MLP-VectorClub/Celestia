import { NextRequest, NextResponse } from 'next/server';

import { getCleanRedirectPath } from 'src/utils/clean-url';

/** Sends visitors with a mangled pasted link (trailing `…` or `<`, backslashes, stray characters) to the cleaned URL */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cleaned = getCleanRedirectPath(pathname + search);
  if (cleaned === null) return NextResponse.next();

  return NextResponse.redirect(new URL(cleaned, request.url), 302);
}

export const config = {
  // Build output and static assets never carry pasted links
  matcher: ['/((?!_next/|favicon.ico).*)'],
};
