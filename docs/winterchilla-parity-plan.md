# Winterchilla → Celestia parity plan

Status: **plan only** (2026-10-01), revised against Winterchilla `1073e4fb` (146 operations; the Winterchilla session answered gaps G1–G10, see §8). Nothing here is implemented, deployed or pointed at production.
Source of truth: Winterchilla `3ec4e41c` — `public/dist/api.json` (135 operations), `docs/api-path-alignment.md`,
`tests/Browser/Api/*` (HTTP contract), `tests/Browser/{Admin,User,Guest}` (page behavior), `config/routes/pages.php` (route list).

Ground rules
- UI is built from **data**. Fields Winterchilla marks as UI details (`li`, `html`, `cgs`, `section`, `render`, `list`, `suggestion`,
  `entryHtml`, `newhtml`, `button`, `pendingReservations`, `cmList`, `changes`, `update`, `notes` in color-group responses, …) are ignored.
  After a write we **refetch the data** (React Query invalidation) instead of splicing server HTML.
- Fetch in `getServerSideProps` with the existing `Service` / `*Fetcher(params, req)` pattern (forwards cookie/authorization), hydrate React Query
  with the result, as `cg/[guide]/index.tsx` does today.
- Do not port `export_vars`; do not touch production or deploy (the user decides).
- `CLAUDE.md` / `AGENTS.md` are not edited by this plan.

## 1. Before any new page: drift between Celestia and the new spec

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
places, see the Winterchilla handoff). Elasticsearch-backed pages (guide search, autocomplete) answer 503 without ES.

## 2. Page inventory

Legend: ✅ exists in Celestia · 🟡 exists but a stub or incomplete · ❌ missing · ⛔ not ported (Twig/server concern).
"gSSP" = endpoints for `getServerSideProps` (all anonymous-readable unless noted; the visitor's cookie is forwarded so permission flags such as
`canEdit` are correct).

### Public / guest pages

| Winterchilla route | Celestia | gSSP endpoints / notes |
|---|---|---|
| `/` homepage redirect | ✅ `pages/index.ts` | `GET /user-prefs/me?keys[]=cg_defaultguide,p_homelastep` |
| `/about`, `/about/privacy` | ✅ | static |
| `/about/connection` (+`/about/browser/{session}` and `/browser/{session}`) | ✅ connection / ⛔ browser | `GET /about/connection`. Browser-recognition page dropped. |
| `/show` (+`/episodes/{page}`, `/movies/{page}`) | 🟡 `pages/show.tsx` | `GET /show?types[]&order&page&size` ×2 (exists). Add `/episodes/[page]`, `/movies/[page]` as redirects to `/show?page=`. |
| `/episode/{S#E#}`, `/episode/pony/…`, `/episode/{id}-slug`, `/movie/{id}`, `/{st}/{id}`, `/episode/latest` | ❌ | `GET /show/latest` or `GET /show?season=&episode=` to resolve `S1E1`/`latest` to an id (redirect to `/episode/{id}-slug`), then `GET /show/{id}`, `GET /posts?showId=&kind=request`, `GET /posts?showId=&kind=reservation`, `GET /show/{id}/vote` (data form, no `html`), `GET /show/next` for the "next up" notice. `show.relatedAppearances` replaces the "characters in this episode" HTML. |
| `/events/{page}` | ❌ | `GET /events?page&size` |
| `/event/{id}` | ❌ | `GET /events/{id}` (has `entries`, `canEnter`, `canVote`, `ongoing`, `ended`). Entry submission is disabled server-side (501), render read-only. |
| `/cg` (index) | ✅ | `GET /color-guide` |
| `/cg/{guide}` | ✅ | `GET /appearances`, `GET /appearances/pinned` |
| `/cg/{guide}/full` | ✅ (needs `/all` repoint) | `GET /appearances/all?guide&previews`; `sort_by` stays snake_case on the page URL only |
| `/cg/{guide}/changes/{page}` | ✅ | `GET /color-guide/major-changes` |
| `/cg/{guide}/v/{id}-slug` (+ short `/cg/v/{id}`) | 🟡 | `GET /appearances/{id}` (`DetailedAppearance`, `canEdit`, `cutieMarks`). `relatedAppearances` and `relatedShows` are now part of the payload. Missing on the page: those two sections, tag list as editable chips, share/export buttons, cutie-mark facing. |
| `/cg/{guide}/tags/{page}` | ❌ | `GET /tags?page&size` (`canEdit` drives the edit UI), `GET /config` for `tagTypes` |
| `/cg/{guide}/tag-changes/{id}` | ⛔ | dropped (staff/dev tool, no data endpoint) |
| `/cg/{guide}/preferred` | ❌ | redirect from `cg_defaultguide` pref |
| `/blending`, `/cg/blending`, `/cg/blending-reverse` | ❌ | client-only tools (no API). Port with a canvas/CSS colour-math util. |
| `/cg/picker`, `/cg/picker/frame` | ❌ | client-only (image upload → sample colours). No API. |
| `/cg/cutiemark/{id}.svg`, `/cg/cutiemark/download/{id}` | ❌ | `CutieMark.viewUrl` points at the file; link to it instead of proxying. |
| `/cg/v/{id}.png|.svg|…` (export formats) | ❌ | `GET /appearances/{id}/sprite` and `/preview` cover sprite and preview SVG only; palette/PNG/GPL/JSON exports are not provided by design: generate them client-side from `colorGroups` (drop the `APPEARANCE_PALETTE` TODO). |
| `/s/{id}` post share link | ❌ | `GET /posts/{id}/location?showId` → redirect to the show page (`castle.url`) |
| `/users` | ✅ (staff) | `GET /users` |
| `/users/{id}`, `/@name`, `/u/{name}`, `/{u|settings}` | 🟡 `users/[user].tsx` (avatar + role only) | `GET /users/{id}/profile` (user, `sameUser`, `canEdit`, `editableRoles`, `contributions` counts, `personalGuides`, `awaitingApproval`, `previousUsernames`, `discordServerMember`); `/users/da/{username}` resolves names; `/u/{uuid}` is not ported (developer-only tool). |
| `/users/{id}/contrib/{type}/{page}` | ❌ | `GET /users/{id}/contributions/{type}?page&size`, type ∈ `cms-provided|requests|reservations|finished-posts|fulfilled-requests` |
| `/users/{id}/cg/{page}` (personal guide) | ❌ | `GET /users/{id}/personal-guide/appearances` (`canManage` drives the add button), `GET /users/{id}/personal-guide/slots` (204/409 for the "can add" check) |
| `/users/{id}/cg/{point,slot}-history/{page}` | ❌ | `GET /users/{id}/personal-guide/point-history` |
| `/users/{id}/cg/{guide}/v/{id}` (PCG appearance) | ❌ | same page component as `/cg/{guide}/v/{id}` with the owner in the breadcrumb |
| `/users/{id}/account`, `/users/verify` | ❌ | account: `GET /user-prefs/me`, `GET /users/{id}/profile` for prefs/Discord state; password, e-mail change/verify and sessions follow Luna's flows (those Winterchilla endpoints are `x-internal`). |
| `/da-auth*`, `/discord-connect/*` | 🟡 `oauth/[provider]` (Luna flow) | Luna owns sign-in; Discord sync/unlink are in the spec now (`POST /users/{userId}/discord/sync`, `DELETE /users/{userId}/discord`) |
| `/docs`, `/components`, `/manifest`, `/muffin-rating`, `/diagnose/*`, `/test-*` | ⛔ | Twig/dev/test pages. `manifest` can be a Next route handler if the PWA manifest is wanted; `muffin-rating` is an SVG easter egg — skip or port as a static image. |

### Staff / admin pages

| Winterchilla route | Celestia | gSSP endpoints / notes |
|---|---|---|
| `/admin` | ❌ | index of links; gate on role from `/users/me` |
| `/admin/logs/{page}` (+ `/logs`) | ❌ | `GET /admin/logs?type&initiatorId&page&size`; detail dialog `GET /admin/logs/{id}` (`details: [[any]]`, loosely typed) |
| `/admin/usefullinks` | ❌ | list: `GET /useful-links` (staff; `/sidebar` is visitor-filtered); CRUD `POST/PUT/DELETE /useful-links[/{id}]`, `PUT /useful-links/order` |
| `/admin/notices` | ❌ | `GET /notices?page&size`, `POST/PUT/DELETE /notices[/{id}]` (`GET /notices/current` already feeds the banner). |
| `/admin/pcg-appearances/{page}` | ⛔ | dropped (no data endpoint, not being ported) |
| `/admin/wsdiag` | ⛔ | developer-only WebSocket diagnostics |
| Site settings dialogs (reservation rules, about-reservations, dev role label) | ❌ | `GET/PUT /settings/{key}` |

### Sitewide shell (affects every page)

| Piece | Celestia | Data source |
|---|---|---|
| Notices banner | ✅ `Notices` | `GET /notices/current` (HTML in `messageHtml` is intentional — sanitise before `dangerouslySetInnerHTML`, `html-to-react` is already a dependency) |
| Sidebar links | ✅ | `GET /useful-links/sidebar` |
| Sidebar notifications | 🟡 | `GET /notifications` is HTML-only and `x-internal`; notifications come from Luna's own API |
| "Happening soon" / upcoming | 🟡 stub (`HappeningSoon`) | `GET /show/next` (one entry) and `GET /events`; `/about/upcoming` is `x-internal` |
| Prefs | ✅ | `GET /user-prefs/me` |

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

## 6. Order of work

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
