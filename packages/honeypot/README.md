# `@mlp-vectorclub/honeypot`

Traps for scanners, for a Next.js front end whose API (Luna) keeps the sessions.

- `createHoneypot({ globs, apiHost, ... })` compiles the trap globs into **one regular expression** when the server process starts (`src/patterns.ts`).
- `honeypot.proxy(request)` is meant for the app's `proxy.ts`. A request for a trap is passed to Luna's `GET /honeypot/{name}`, which flags the
  visitor's session in its database (starting a session when there is none) and answers with the session cookie, which goes back to the visitor.
  Every other request carrying the session cookie is checked against Luna's `GET /internal/session-status` (answers are remembered for 30 s, flagged
  sessions for an hour). A flagged session gets a plain `403` everywhere. Nothing the browser holds, apart from the session, can undo the flag.
- `honeypot.robotsTxt(...)` builds a robots.txt that lists every trap as disallowed, so nothing that behaves ever springs one.
- Luna being unreachable never locks anybody out: sessions count as not flagged and traps still answer `403`.

The source is consumed as it is (`transpilePackages` in the app's `next.config.js`), there is no build step. `pnpm --filter @mlp-vectorclub/honeypot test`
runs the tests.

Luna's side: `HoneypotController`, the `RejectFlaggedSession` middleware and `GET /internal/session-status`.
