# `@mlp-vectorclub/honeypot`

Traps for scanners, for a Next.js front end whose API (Luna) keeps the sessions.

- `createHoneypot({ globs, apiHost, ... })` compiles the trap globs into **one regular expression** when the server process starts (`src/patterns.ts`).
- `honeypot.proxy(request)` is meant for the app's `proxy.ts`. A request for a trap is passed to Luna's `GET /honeypot/{name}`, which flags the
  visitor's session in its database (starting a session when there is none) and answers with the session cookie, which goes back to the visitor.
  Every other request carrying the session cookie is checked against Luna's `GET /internal/session-status` (answers are remembered for 30 s, flagged
  sessions for an hour). A flagged session gets a plain `403` everywhere. Nothing the browser holds, apart from the session, can undo the flag.
- A trap can name a **decoy** (`{ glob: '/.env', decoy: 'env' }`): the visitor is flagged all the same, but the first answer is a real-looking `200`
  instead of the plain refusal. Built once when the server starts, so the random secrets stay the same until a restart:
  `env` (a Laravel `.env` full of generated keys and passwords, none of which open anything), `git-config` (a `.git/config` with a token in the remote),
  `wordpress-login` and `adminer-login` (bare mock login pages in Comic Neue from Google Fonts and water.css from jsDelivr, both pinned; they have the
  field names the real ones have, and a few lines of inline script, allowed by hash in the page's own CSP, make the form "work" without any request:
  it waits a moment and says the login failed). Decoys are sent with `Cache-Control: public` and a long lifetime, so a shared cache or a browser
  answers repeat visits and the server never sees them (those visits flag nothing, the price of keeping the load down).
- `honeypot.robotsTxt(...)` builds a robots.txt that lists every trap as disallowed, so nothing that behaves ever springs one.
- Luna being unreachable never locks anybody out: sessions count as not flagged and traps still answer `403`.

The source is consumed as it is (`transpilePackages` in the app's `next.config.js`), there is no build step. `pnpm --filter @mlp-vectorclub/honeypot test`
runs the tests.

Luna's side: `HoneypotController`, the `RejectFlaggedSession` middleware and `GET /internal/session-status`.
