# Winterchilla → Celestia parity plan

**Status (2026-10-10): built and deployed.** The sections below were written as a plan on 2026-10-01 and are kept for the reasoning behind the decisions (data
contract, write conventions, shared components); where a status in them disagrees with this block, this block is right. The page inventory in §2 is current.

## Current status (2026-10-10)

Deployed to https://next.mlpvector.club: Celestia (Next.js), Luna (Laravel API) and Muffins (websocket server). Winterchilla still serves the old site; the shared database
cutover has not happened (DeviantArt token sync in Luna stays off until it). The "work in progress" banner is still on.

| Area | State |
|---|---|
| Public pages (guide, full list, changes, tags, appearance, shows, episodes, events, users, profile, personal guide, about) | ✅ built, see §2 |
| Member flows (reserve, finish, approve, take over an overdue reservation, requests, voting, account, Discord, preferences) | ✅ |
| Guide editing (metadata, inline tag editor, sprite, cutie marks, color groups, relations, shows, order, selective wipe, share links of private appearances) | ✅ |
| Staff / admin (tags, shows, roles, PCG points, logs, notices, useful links, PCG appearance list, settings dialogs, developer tools, websocket diagnostics) | ✅ |
| Client tools (blending, blending reverser, color picker) | ✅ |
| Sitewide (notices, sidebar links, notifications over REST and websocket, "happening soon", Discord invitation rules, deploy banner, updating page) | ✅ |
| Side-by-side visual comparison with the old site | 🟡 done page by page until 2026-10-06, see `ui-parity-plan.md` for which pages have not been compared |

**Verification numbers.** Winterchilla's browser suite against Celestia and Luna (`Winterchilla/scripts/ui-test-celestia.sh`): 112 passed, 0 failed. The tests that only make sense on
the old site (`winterchilla-only`: 21 tests or files, three of them whole files (the dialog test page and the DeviantArt and Discord sign-in flows through the old fake OAuth provider), the rest drive its own DOM, `/components`, `/docs`, diagnose and browser pages) are left out; 17 `celestia-only` tests cover
Celestia's own versions of the editor flows (dialogs, tag editor, relations, share links, takeover, sort menu). Celestia's own tests: 434 (unit and real-browser component
tests), 30.8 % of lines. Luna: 289 tests.

**Open items (known, 2026-10-10)**
- Private appearances: the share link, the page, its sprite, PNG and swatch files and the cutie mark downloads work with the token, and the owner can generate a new link (✅ built 2026-10-10).
  What the old site did not do either: a visitor who arrived with a token does not get the token in their own Share button (only people who may edit do).
- Staff "Add new appearance" in another user's personal guide: Luna's `POST /appearances` creates in the caller's own guide, so this needs an API change (the old API had no owner parameter either).
- Tag autocomplete only suggests tags that are in use (the API's behavior); tags nobody uses yet have to be typed in full.
- Cutie mark file details differ in cosmetic ways (download file name, `width="100%"` on the SVG).
- Not compared side by side yet: narrow / mobile layouts, the episode page with real request and reservation lists, the dense lists of production-sized data. The pages compared on 2026-10-13 are in `ui-parity-plan.md`.
- Not verified on production in a browser: signed in websocket notifications, the live `/admin/wsdiag` page, the updating page and the deploy banner on a real deploy (whether Cloudflare
  replaces the 503 body is unknown), and the changes of 2026-10-10 (tag editor, reserver pill, takeover, Discord button, sprite sizes, private share links).
- Tests: the DeviantArt and Discord sign-in flows have no automated browser test against Celestia (`scripts/check-oauth-popup.mjs` covers the popup); a Discord server member cannot be
  created through the seed or the API for a browser test; the guide editing dialogs, most pages and the websocket hooks have no unit tests.

**Not ported on purpose:** event entry creation (disabled in the old site as well; editing and withdrawing entries is ported), the tag changes page (an unfinished stub on the old site,
Luna has the data endpoint), `/components`, `/docs` (redirects to Luna's API docs), the diagnose pages, the old `/da-auth` and `/discord-connect` routes (redirected to Luna's OAuth),
the browser recognition page (`/browser`, `/about/browser` redirect to `/about/connection`), `DELETE /admin/stat-cache` (the deploy reloads php-fpm), taking over an overdue
reservation as staff (the old site only offered it to other members).

Ground rules
- UI is built from **data**. Fields Winterchilla marks as UI details (`li`, `html`, `cgs`, `section`, `render`, `list`, `suggestion`,
  `entryHtml`, `newhtml`, `button`, `pendingReservations`, `cmList`, `changes`, `update`, `notes` in color-group responses, …) are ignored.
  After a write we **refetch the data** (React Query invalidation) instead of splicing server HTML.
- Fetch in `getServerSideProps` with the existing `Service` / `*Fetcher(params, req)` pattern (forwards cookie/authorization), hydrate React Query
  with the result, as `cg/[guide]/index.tsx` does today.
- Do not port `export_vars`; do not touch production or deploy (the user decides).
- `CLAUDE.md` / `AGENTS.md` are not edited by this plan.

## 1. Before any new page: drift between Celestia and the new spec (historical, done in phase 0)

Verified 2026-10-01: `api.json` generated from Winterchilla `origin/main` (`1073e4fb`) builds with the existing `packages/api-types` generator, and
`tsc --noEmit` in `apps/celestia` then reports **101 errors** (clean before). Hot spots: `services/user.ts` (Luna-only auth types), the color guide
components (`Appearance*` helper types such as `AppearanceOnly`, `AppearancePreviewData`, `CutieMarkFacing` no longer exported; `sprite.path/aspectRatio`
gone; `PreviewAppearance` now requires `previewData`), `SidebarUserInfo`/`authSlice` (`/users/me` shape), `SidebarUsefulLinks`.

Decisions from the Winterchilla side:
- **Auth belongs to Luna** (`/sanctum/csrf-cookie`, `/users/signin`, `/users/oauth/signin/{provider}`, `POST /users`, `/users/tokens`, `/about/sleep`) and is not
  in the contract; Celestia's existing sign-in code stays Luna-shaped and its auth types must be hand-written (or from Luna's own spec), not from
  Winterchilla's `api.json`. `POST /users/signout` is the one shared endpoint. Read `security: SessionCookie` as "signed in".
- `GET /appearances/full` (not `/all`) — matches what Celestia already calls.
- `x-internal` operations (HTML-only, Winterchilla sessions, and the staff-only e-mail/password flows) are **not implemented by Luna/Celestia**:
  `/about/upcoming`, `/cg/full`, `*/lazyload`, `/posts/{id}/reload`, `/show/{id}/posts`, `/posts/requests/suggestion`, `/notifications`, `/users/{id}/avatar-wrap`,
  `DELETE /users/{id}/contributions/cache`, `/users/session/status`, `DELETE /users/sessions/{id}`, `DELETE /admin/stat-cache`,
  `POST /users/me/password`, `/users/email/verify`, `/users/{id}/email-changes`. Account/e-mail/password/sessions UI therefore follows Luna's flows.
- Not provided on purpose: sessions list (use Luna `/users/tokens`), `/u/{uuid}`, palette exports (compose PNG/GPL/JSON client-side from `colorGroups`),
  admin PCG list / tag changes / browser-recognition pages (dropped).

Phase 0 therefore starts with: point `API_JSON_PATH` at the regenerated spec, rebuild `api-types`, and fix the 101 errors (many are renames; the auth ones
need Luna types). Keep the spec pinned (commit hash) in `packages/api-types/README`, regenerate deliberately.

### Phase 0 status (2026-10-01)

Done against Winterchilla `2752ab51` (`API_JSON_PATH` is a local, git-ignored `.env`; point it at Winterchilla's `public/dist/api.json`): `tsc`, lint, vitest
and `next build` are green. Compat layer: `src/types/api-alias.ts` (renamed contract types), `src/types/auth.ts` (Luna-owned auth types, hand-written),
`currentUserFetcher` unwraps `{user, sessionUpdating}` and tolerates Luna's older flat shape. Data now comes from the contract: sprites from
`/appearances/{id}/sprite?size&hash` in a square box (no aspect ratio), full list `sort` + `groups` from the API, autocomplete `PreviewAppearance`,
`guide`/`previewData` on appearances, boolean prefs from the `UserPrefs` schema. `connection` page lost `deviceIdentifier` (not in the contract).
All gaps raised so far were answered by Winterchilla (see §8).

### Phase 1 status (2026-10-01)

Built (read-only, SSR with React Query hydration, `tsc`/lint/vitest/build green, **not yet exercised against a running API**): `useConfig` + `/config` server
cache + pattern compiler (unit tested), `ResourceService`/`content` fetchers and hooks, `/events`, `/event/[id]`, `/cg/[guide]/tags`, full profile
(`/users/[user]`: previous names, Discord, personal guides, awaiting approval, contribution counts), `/users/[user]/contrib/[type]`, `/users/[user]/cg`,
`/users/[user]/cg/point-history`, `/users/[user]/cg/v/[id]` (shares `AppearanceView` with `/cg/[guide]/v/[id]`, which now shows related shows and related
appearances). Also built: `/episode/[id]`, `/movie/[id]`, `/special/[id]` (resolves `latest`, `S#E#` and numeric IDs, canonical redirect, related appearances, vote results, request and reservation lists as data; no actions yet). Not done yet from phase 1: `/s/{id}`, `/episodes|movies/{page}` redirects.
Notes: event entry images are remote URLs (check the CSP `img-src` before relying on them); the short link `/cg/v/{id}` now resolves through the full appearance because
`PreviewAppearance` (locate) has no owner for personal-guide appearances.

### Verifying against a local API

Winterchilla ships `scripts/serve-seeded-api.sh [port] [database]` (a throwaway seeded API on its own port and database; never port 8765 or `winterchilla_test`).
Run it from a git worktree of Winterchilla `origin/main` (symlink `vendor`, copy `.env`), then start Celestia against it without touching `.env`:

```sh
NEXT_PUBLIC_BACKEND_HOST=http://127.0.0.1:8766/api/v0 NEXT_PUBLIC_FRONTEND_HOST=http://localhost:3100 \
NEXT_PUBLIC_CDN_DOMAIN=127.0.0.1 NEXT_PUBLIC_API_PREFIX=/api pnpm exec next dev -p 3100 -H 127.0.0.1
```

Sign in as a seeded user by visiting `http://127.0.0.1:8766/test-login/9001` (user), `9002` (admin) or `9003`; the `access` cookie is host-wide, so Celestia on
`127.0.0.1:3100` forwards it. Responses can also be checked against `api.json` (an Ajv script over the GET endpoints found that the API disagrees with the spec in a few
places, see the Winterchilla handoff). OpenSearch-backed pages (guide search, autocomplete) answer 503 without ES.

### Phase 2 status (2026-10-01)

Built: `useApiMutation` (API errors become `UnifiedErrorResponse`, `describeApiError`/`fieldErrors`, 409 hints kept in `details`), `DialogProvider`/`useDialog().confirm`,
`FormDialog`, `PostService`, post actions on every post (reserve, mark finished with the reserver-overwrite retry, approve, unfinish, remove approval, cancel
reservation, delete request) driven by `getPostActions` (unit tested), add request / add reservation dialogs with image check, and voting on aired episodes.
Verified request shapes and conflicts with a Sanctum-style cookie + `X-XSRF-TOKEN` client against the seeded API (through a throwaway proxy that turns the header into
Winterchilla's `CSRF_TOKEN` parameter); the UI itself was not clicked through (no browser extension available). Also built: the account page (`/users/[user]/account`: preference switches/selects through `PUT /users/{id}/preferences/{key}`, Discord sync/unlink, sign out everywhere; password and e-mail stay with Luna). Its content is client-rendered (auth state is not available during SSR yet), so it was only checked for compilation and the SSR shell. 
### Phase 3 status (2026-10-01)

Built (guide editing on the appearance page, gated by `canEdit` / staff role): metadata (always sends the current `guide`: omitting it moves the appearance to a
personal guide on Winterchilla), tags (plain text with `origTags`), sprite upload/remove, pin/unpin, delete, color group create/edit/delete/re-order/apply template,
related appearances and linked shows (transfer list). Not done: cutie mark editor (`/cutie-marks`, `sanitize-svg`), full-list drag-and-drop ordering (`PUT /appearances/order`),
tag admin, show admin, user role / PCG points, logs, notices, useful links, settings.
Checked: request bodies of these flows against Luna (`:8766`, bearer token) and Winterchilla (`:8768` through the CSRF proxy); UI not clicked through.


## 2. Page inventory (current)

Legend: ✅ built and checked against the old behavior · 🟡 built, differs in a way noted · ❌ missing · ⛔ not ported on purpose.

### Public / guest pages

| Winterchilla route | Celestia | Notes |
|---|---|---|
| `/` homepage redirect | ✅ `pages/index.ts` | preference `cg_defaultguide` / `p_homelastep` |
| `/about`, `/about/privacy`, `/about/connection` | ✅ | `/about/browser`, `/browser` redirect to `/about/connection` |
| `/show` (+`/episodes/{page}`, `/movies/{page}`) | ✅ | the page routes redirect to `/show?page=` |
| `/episode/{S#E#}`, `/episode/{id}-slug`, `/episode/latest`, `/movie/{id}`, `/{st}/{id}` | ✅ `episode`, `movie`, `short`, `special`, `show/[id]` | canonical redirects; request / reservation lists, voting, reserver pill, overdue takeover |
| `/events`, `/events/{page}`, `/event/{id}` | ✅ | entry cards with edit and withdraw for the author and staff (creating entries is disabled on both sides) |
| `/cg` (index), `/cg/{guide}`, `/cg/{guide}/full`, `/cg/{guide}/changes/{page}` | ✅ | list items with sprite ⋯ menu, tags, buttons; full list with sort menu and staff reorder |
| `/cg/{guide}/v/{id}-slug` (+ short `/cg/v/{id}`) | ✅ | related shows and appearances, inline tag editor, share link (with the token for private ones), 300px sprite from the 600px file |
| `/cg/{guide}/tags/{page}` | ✅ | staff tag admin |
| `/cg/{guide}/tag-changes/{id}` | ⛔ | an unfinished stub on the old site (always 404) |
| `/cg/{guide}/preferred` | 🟡 | `/cg/preferred` redirects to `/cg` |
| `/blending`, `/cg/blending`, `/cg/blending-reverse`, `/cg/picker`, `/cg/picker/frame` | ✅ | old addresses redirect |
| `/cg/cutiemark/{id}.svg`, `/cg/cutiemark/download/{id}` | ✅ | proxied from Luna, takes the share token |
| `/cg/v/{id}.png|.svg|.json|.gpl` (exports) | ✅ | rewritten to Luna's `/appearances/{id}/image` and `/palette` |
| `/s/{id}` post share link | ✅ | `GET /posts/{id}/location`, the post is highlighted on arrival |
| `/users`, `/users/{id}`, `/@name`, `/u/{name}`, `/{u|settings}` | ✅ | profile with briefing, contributions, personal guide, pending reservations, preferences |
| `/users/{id}/contrib/{type}/{page}` | ✅ | |
| `/users/{id}/cg/{page}`, `/users/{id}/cg/{point,slot}-history/{page}`, `/users/{id}/cg/{guide}/v/{id}` | ✅ | slot history redirects to point history |
| `/users/{id}/account`, `/users/verify` | ✅ | sessions, security, Discord, DeviantArt, preferences |
| `/da-auth*`, `/discord-connect/*` | ✅ | Luna's OAuth (`/oauth/[provider]`), old routes redirect |
| `/manifest`, `/muffin-rating` | ✅ | |
| `/docs`, `/components`, `/diagnose/*`, `/test-*` | ⛔ | `/docs` redirects to Luna's API docs; `/test-login/{id}` exists for browser tests only (`E2E_TEST_LOGIN=1`) |

### Staff / admin pages

| Winterchilla route | Celestia | Notes |
|---|---|---|
| `/admin` | ✅ | index, developer OpenSearch status, recent posts |
| `/admin/logs/{page}` (+ `/logs`) | ✅ | filters, entry details with the both / new / old switch |
| `/admin/usefullinks`, `/admin/notices` | ✅ | |
| `/admin/pcg-appearances/{page}` | 🟡 | built, not compared side by side |
| `/admin/wsdiag` | ✅ | developer-only, live list of connected websocket clients with their origin |
| Site settings (reservation rules, about reservations, developer role label) | ✅ | edited where they are shown (`ReservationTexts`, `DevRoleLabelDialog`) |

### Sitewide shell

| Piece | Celestia | Notes |
|---|---|---|
| Notices banner | ✅ `Notices` | sanitized HTML |
| Sidebar links | ✅ | guests get the `guest` links |
| Header navigation | ✅ | Winterchilla's order, plus Events |
| Sidebar notifications | ✅ | REST list plus websocket push (Muffins), unread count on the mobile toggler |
| "Happening soon" | ✅ | `GET /show/upcoming` with a countdown |
| Join Discord button | ✅ | hidden for users on the server (`discordServerMember` of `/users/me`) and for those who hid it |
| Prefs | ✅ | `GET /user-prefs/me` |
| Deploy banner / updating page | ✅ | asks for a reload instead of reloading, nginx serves the updating page while the app restarts |

## 3. Global data: `/config`, auth, prefs

**`GET /config`** replaces `export_vars`. Plan:
- `src/fetchers/config.ts` + `ConfigService`; a `useConfig()` hook backed by React Query with `staleTime: Infinity`.
- Fetch **once per server render in `_app` `getInitialProps`/store wrapper**, hydrate into the Redux `core` slice (so SSR output has patterns/roles
  on first paint and there is no client waterfall). Cache in-process on the Node side with a short TTL (the response is "the same for every
  visitor"), keyed by nothing.
- Patterns arrive as `{source, flags}`: build `new RegExp(source, flags)` once in a `compilePatterns()` selector and use it for form validation
  (`printableAscii`, `hexColor`, `username`, `episodeTitle`). Also feed `tagTypes`/`roles`/`showTypes` into the labels (replace hard-coded
  `role-label.ts` maps where they overlap), `maxUploadSize` into upload dialogs, `discordInviteLink` into the footer/about, and `wsServerHost` only if
  we ever port live updates (not planned).
- Add a unit test that every pattern in a fixture of `/config` compiles in JS (Winterchilla only proves PHP).

**Auth.** The contract describes auth per endpoint and leaves the mechanism to Luna/Sanctum, but the *spec contains no endpoint to obtain a
session or token* by design: Luna owns auth. Celestia keeps its Luna sign-in flow and treats auth as: forward the incoming `cookie`/`authorization` header (already done by
`Service.getRequestOptions`) and read the user from `GET /users/me`. Page-level gates use `GET /users/me` role and the per-resource `canEdit`/`canManage`/`canEnter`
flags — never re-derive from roles (the contract's stated intent).

**Prefs.** `GET /user-prefs/me?keys[]=` for reads; writes go to `PUT /users/{id}/preferences/{key}` (form-encoded, one key at a time). Keep the
`usePrefs` hook and add a `usePrefMutation(key)` that optimistically updates the `user-prefs/me` query.

## 4. Write flows

Conventions for every mutation (shared `useApiMutation` wrapper around axios + React Query):
- JSON bodies are camelCase. The write API now accepts `application/json` as well as form-encoded everywhere, so **always send JSON** (the spec still
  lists form encoding on some operations: signout, role, points, prefs, useful-links order; lists of scalars are read as comma lists, nested values as JSON strings).
- Status handling: `401` → open sign-in dialog and replay; `403` → toast + refetch permissions; `404` → refetch the list; `409` → conflict dialog
  (some carry actionable fields, e.g. `canForce` on `POST /posts`, `retry` on `PUT …/finish`, `uses` on tag delete, `synonymOf` on tag autocomplete);
  `419` → re-init CSRF then replay once (only if the final auth model needs it); `422` → map `errors[field][0]` onto the form field (one error per
  response); `429`/`5xx` → toast with `message`.
- Success: invalidate the owning query keys (`['post-list', showId, kind]`, `['appearance', id]`, `['tags']`, …). Never read `li`/`html`/`cgs`.

| Flow | Endpoints | UI notes |
|---|---|---|
| Reserve / un-reserve | `POST/DELETE /posts/{id}/reservation` | button on `PostListItem`; 409 body has the current state → refetch |
| Add request / reservation | `POST /posts` `{kind, showId, postas?, allowNonmember?}` (returns int `id`; ignore `idString`); `POST /posts/check-image` for the preview + title; `POST /posts/reservations` (staff, on behalf) | `PostCreateDialog`; check-image on blur; 409 `canForce` → confirm and resend with `allowNonmember` |
| Edit post / change image | `GET/PUT /posts/{id}`, `PUT /posts/{id}/image` | edit dialog; type `chr|obj|bg` |
| Finish / unfinish / unbind | `PUT/DELETE /posts/{id}/finish` (`deviation`, `allowOverwriteReserver`, `finishedAt`; `DELETE ?unbind`) | `retry` flag on 409 means "try again after the club-gallery sync" |
| Approve / unapprove | `POST/DELETE /posts/{id}/approval` | staff-only unapprove; developer-only if still in the gallery (403 otherwise) |
| Delete request, unbreak | `DELETE /posts/requests/{id}`, `POST /posts/{id}/unbreak` | write responses now carry `post` (`PostItem`) next to `li`: update the cache from `post`. The random-request suggestion is `x-internal`: pick one client-side from `GET /posts?showId&kind=request`. |
| Vote | `GET/POST /show/{id}/vote` `{vote}` | refetch `GET …/vote` (data) afterwards |
| Show create/edit/delete, link appearances | `GET /show/prefill`, `POST /show`, `PUT/DELETE /show/{id}`, `GET/PUT /show/{id}/appearances` | staff; "set" semantics (verb is `PUT`; the spec docblock typo was fixed) |
| Appearance create/edit/delete/pin/template | `POST /appearances`, `GET /appearances/{id}/metadata` + `PUT/DELETE /appearances/{id}`, `POST/DELETE …/pin`, `POST …/template`, `DELETE …/contents` | `201` may return `{goto}` for PCG creation |
| Appearance ordering | `PUT /appearances/order` (full list drag/drop, staff) | |
| Color group edit | `POST /color-groups`, `GET/PUT/DELETE /color-groups/{id}`, `GET/PUT /appearances/{id}/color-groups/order` | see below |
| Tags (appearance) | `GET/PUT /appearances/{id}/tags` (plain text `tags`, `origTags` for conflict detection), `GET /tags/autocomplete?s` | chips editor over the text format |
| Tags (admin) | `GET /tags/autocomplete`, `POST /tags`, `GET/PUT/DELETE /tags/{id}` (`?sanityCheck`), `PUT/DELETE /tags/{id}/synonym`, `POST /tags/recount-uses` | `409 {uses}` → "used N times, delete anyway?" |
| Sprite upload / remove | `POST /appearances/{id}/sprite` (multipart `sprite`), `DELETE …/sprite` | validate size against `config.maxUploadSize`; PCG owners may get 403 by preference |
| Cutie marks | `GET/PUT /appearances/{id}/cutie-marks` (≤4), `POST …/sanitize-svg` (multipart `file`) | upload → sanitize → preview → `PUT` the list; keep the 4-mark limit client-side too |
| Relations / linked shows | `GET/PUT /appearances/{id}/relations` (`ids`, `mutuals`), `GET/PUT /appearances/{id}/shows` | two-column "unlinked / linked" transfer-list component; `mutual` toggles on linked rows |
| Personal guide | `GET /users/{id}/personal-guide/slots`, staff points `GET/POST …/points`, `POST …/point-history/recalculation` (dev) | |
| Account | `POST /users/signout {everywhere}`, `PUT /users/{id}/preferences/{key}`, Discord `POST /users/{userId}/discord/sync`, `DELETE /users/{userId}/discord`; password/e-mail/sessions are Luna's (the Winterchilla equivalents are `x-internal`) | |
| User admin | `PUT /users/{id}/role` (form `value`; `200 {alreadyIn}` vs `204`), `DELETE /users/{id}/contributions/cache` | `editableRoles` from the profile decides the options |
| Staff site admin | notices, useful links, `PUT /settings/{key}`, `DELETE /admin/stat-cache` (dev), `POST /color-guide/reindex` + `GET /color-guide/export` (dev) | |

**Color group editor (largest component).** Data comes from `GET /color-groups/{id}` (`PrivateColorGroup`) or empty for create; form model
`{label, colors: [{id?, label, hex}], major, reason}`; `major` requires `reason`. Rules to port: hex validated with `config.patterns.hexColor`,
colour rows reorderable, rows without `id` are created, missing ids are deleted. After save: invalidate `['appearance', id]` and
`['color-guide-changes', guide]`; for create, the response `id` is enough. Template apply (`POST …/template`) and group reorder use the same
invalidation. Ignore `appearancePage`, `fullChangesSection` request flags (HTML-render hints) — send neither.

## 5. Shared components and hooks to build

Existing and reusable: `Pagination`, `Content`, `StandardHeading`, `StatusAlert`, `NoResultsAlert`, `UserLink[WithAvatar]`, `AppearanceItem`,
`ColorSquare`, `ColorListItem`, `Tag`, `TimeAgo`, `Notices`, `Breadcrumbs`, `modals/AuthModal`.

New:
1. **Dialog system** — a promise-based `useDialog()` over reactstrap `Modal` (confirm, form, wait, details). Winterchilla's `Dialog/DialogTest` (21 cases)
   is the behavior spec: focus trap, Escape, stacked confirm, busy state disables buttons, error alert inside the dialog.
2. **`useApiMutation` + `ApiError`** (status mapping in §4), **`FormField`** with 422 field mapping, `useConfig`.
3. **Post list** — `PostList`, `PostListItem` (state machine: request / reserved / finished / approved / broken / overdue; buttons from
   `canEdit` + role), `PostCreateDialog`, `PostFinishDialog`, `PostEditDialog`; reused by the show page, profile ("awaiting approval"), contributions.
4. **Color group editor** + `ColorGroupsPanel` (display + reorder), `ColorInputRow`.
5. **Appearance editors** — `AppearanceMetaDialog`, `TagsEditor`, `SpriteUploadDialog`, `CutieMarkEditor`, `TransferList` (relations & show links).
6. **Admin table** — `DataTable` with server pagination via `Pagination` (logs, notices, links, tags list), `RoleSelect`, `LogDetailsDialog`.
7. **Pagination helper** — a `usePagedQuery(key, fetcher)` that reads `{currentPage,totalPages,totalItems,itemsPerPage}`, plus a shared
   `getServerSideProps` helper around the existing `validatePageParam`. Existing `utils/pagination.ts` keeps its tests.
8. **Utilities** — `PermissionGate` (renders by `canEdit`/`canManage`/role), client-only tools lib for blending/picker.

## 6. Order of work (all phases are done, kept for reference)

0. **Foundations** (1 PR): regenerate `api-types`; fix drift (§1); `useConfig`; `useApiMutation`/`ApiError`; dialog system; `PermissionGate`; hand-write/derive the Luna auth types.
1. **Read-only parity**, cheapest first: events list+detail → profile (full `UserProfile`) → contributions → personal guide + point history →
   tags list → episode/movie page (read only: posts + vote data) → appearance page completions → `/s/{id}`, `/episodes|movies/{page}` redirects.
2. **Member write flows**: post list actions (reserve/finish/approve/edit/request) → vote → account page (prefs, password, e-mail, sessions, Discord).
3. **Guide editing**: appearance meta/tags/template → color group editor → sprite → cutie marks → relations/shows → pin/order.
4. **Staff/admin**: tags admin, show admin, user roles/PCG points, logs, notices, useful links, settings, dev tools.
5. **Client tools**: blending, blending-reverse, picker; export formats composed client-side from `colorGroups`.

Each phase ends with the parity checks below before the next starts. Pages are shipped dark behind existing routes only after the user decides about
cutover; no phase deploys.

## 7. Verifying parity page by page

1. **Contract layer (automatic).** Run Winterchilla's `tests/Browser/Api/*` against the target API (they use `ApiClient`). In Celestia, add a
   vitest suite per `*Fetcher`/mutation that replays recorded fixtures (`GET /posts?showId=…`, 422 body, 409 bodies) captured from the test server
   so shape drift fails `pnpm test` immediately. Also a CI step that regenerates `api-types` from the pinned `api.json` and type-checks.
2. **Behavior layer (per page).** Each Winterchilla suite under `tests/Browser/{Admin,User,Guest}` is the checklist for the matching page. Create
   `docs/parity/<area>.md` rows `Winterchilla test name → Celestia status (✅/🟡/❌) → how verified`. Mapping:
   - Guest/PublicPagesTest, RemainingRoutesTest, MiscRoutesTest → section 2 public table (status codes, redirects, 404s).
   - User/EpisodeTest, VoteTest, PostReservationTest, PostFinishTest, PostEditingTest → show page + post list.
   - User/UserProfileTest, PersonalGuide*Test, DiscordAuthTest, DeviantArtAuthTest, AuthTest → profile, contributions, PCG, account/auth.
   - User/ColorGuideTest, Admin/{AppearanceManagement,Cutiemark,Relations,GuideRelations,Sprite,TagEditing,TagSynonym}Test → guide pages + editors.
   - Admin/{AdminTest,UsefulLinksTest,ErrorMessageTest}, Dialog/DialogTest → admin pages, dialogs, error rendering.
3. **Browser layer.** Add Playwright for Celestia (not present today) running the same scenarios against a Luna/Winterchilla test server with the
   seeded users from `TestSeederConstants` (guest, member, staff, dev). Port tests as scenario-for-scenario translations, same names, so the table in
   step 2 can be filled by grepping for them. Assertions must be on real content (Winterchilla's own lesson: `assertDontSee('Fatal error')` hid bugs).
4. **Visual spot-check.** Side by side screenshots (existing Chrome tooling) for the ~10 densest pages (episode, appearance, profile, tags,
   color group dialog); not a gate.
5. **Definition of "done" for a page:** all matching Winterchilla tests have a ✅ row; SSR output has no client-only loading flash for
   its primary data; permissions are driven by response flags; all 4xx shapes above are handled.

## 8. API gaps: status after the Winterchilla answers (`1073e4fb`)

Sent as G1–G10 on 2026-10-01; all answered.
- **Fixed:** G1 (Discord sync/unlink documented; `/appearances/full`), G2 (`relatedAppearances`/`relatedShows`, `GET /useful-links`), G3 (envelope typing; `post` in post write
  responses; HTML-only operations marked `x-internal`), G5 (`GET /show/latest`, `season`/`episode` filters), G8 (camelCase fixes, int `id` + `idString`, JSON bodies, default security), G10.
- **By design, not provided:** auth/session/token endpoints (Luna), sessions list (G4), `/u/{uuid}` (G6), appearance exports (G7), admin PCG / tag-changes / browser pages (G9).
- **Still to watch (found while re-checking):**
  - Three account operations the account page would need (`password`, `email-changes`, `email/verify`) are `x-internal` and `roleGate('staff')`: Celestia's account page must be built on Luna's flows, which nothing here specifies.
  - The spec's read-only `Session`-style data is gone, so "log out other devices" relies on `POST /users/signout {everywhere}` only.
  - The color-group, template and `PUT /appearances/{id}` responses still return mostly rendered strings (documented as UI details): always refetch after those writes.
  - `/users/me` and the other auth types are Luna's; they will not appear (or will differ) in `api.json` and need their own type source.
