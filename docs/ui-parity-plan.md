# UI parity plan: Celestia looks and acts like Winterchilla

**Goal (user, 2026-10-05):** a full recreation that works as close to identically to the old site as possible, with every button and link
performing the same action as before. This file is the working plan: update the status columns as work lands and commit it with the code.
It complements `winterchilla-parity-plan.md` (data and features through the API) with the look, layout and behavior of every page.

## Method

1. **Same data in both sites.** Real data gives far better comparisons than the contract seed (which has no color groups or sprites).
   - Winterchilla on the production copy: `TEST_MODE=true TEST_DB_NAME=prod_copy DB_NAME=prod_copy APP_URL=http://127.0.0.1:8768 PHP_CLI_SERVER_WORKERS=4 php -d variables_order=EGPCS -d opcache.revalidate_freq=0 -S 127.0.0.1:8768 -t public` (in `Winterchilla`; `prod_copy` is a local scratch copy of a production dump, keep it out of git).
   - Luna on the same data: `DB_DATABASE=luna_import php artisan migrate --force`, then Luna's contract server command (`scripts/serve-contract.sh`) with `DB_DATABASE=luna_import` on :8766, reindex Elasticsearch (`POST /color-guide/reindex` as a developer, user 1), import sprites with `LARAVEL_STORAGE_PATH=<scratch> php artisan fs:migrate <Winterchilla/fs> 1 --wipe`, serve `<scratch>/app/public` as `public/cdn` and start Luna with `CDN_URL=http://127.0.0.1:8766/cdn` and the same `LARAVEL_STORAGE_PATH` (remove the symlink afterwards, it is untracked).
   - Celestia: `scripts/serve-ui-test-instance.sh` (http://localhost:3000, needs Luna on :8766).
2. **Capture** both sites for every page in the table below as **every role**: guest, DeviantArt user (user 2), club member (3), assistant (132), staff (133), admin (136) and developer (1) of the production copy. The old site gives assistant, staff and admin the same permission level (`Permission::ROLES`: guest 1, user 2, member 3, assistant/staff/admin 4, developer 255), but what each role may do and see differs (sidebar, forms, buttons, which pages answer 403), so every page has to be compared per role, not just for guests and one staff account: `node scripts/ui-audit/capture.mjs <out dir> [page,page] [guest,admin]` writes a full page screenshot per page, site and role plus `inventory.json` (headings, links, buttons and inputs of the main column).
3. **Diff the labels:** `scripts/ui-audit/diff.py <out dir> [page ...]` lists headings, links, buttons and inputs that exist on one site only. Then look at the two screenshots of the page and read the old Twig template (`Winterchilla/templates`), its scss (`assets/scss`) and its page script (`assets/js/pages`) for what the elements do.
4. **Fix** the page, rebuild the instance, capture again. The Winterchilla UI tests (`Winterchilla/scripts/ui-test-celestia.sh`) must stay green.
   The capture script bypasses the content security policy of the pages: a production build only allows its configured CDN host for images, the local sprite host would be blocked.
5. Things that the old site's page scripts do on their own (a test session is signed out again when the DeviantArt refresh fails) are why the capture script signs in before every page.

Old site's computed colors: link button `#337287` on `#e1edf2` text, ribbons blue `#0070e9`, orange `#bb4400`, green `#008000`, dark blue `#0022aa`, grey `#ccc`.

## Roles and what each may do (old site; check every item per role)

Levels: guest 1, DeviantArt user 2, club member 3, assistant = staff = admin 4, developer 255 (`Winterchilla/app/Permission.php`). "Staff" below means level 4 or higher. The old code has about 150 role checks (`grep -rn "permission('" templates app`); the ones that decide what a visitor sees or can press:

| Role | Gets (on top of the role below) |
|---|---|
| Guest | Public pages; sign-in; the sign-in prompt on "Make a request"; color guide copy toggle. 403 on the admin area, other people's account pages, private personal guides |
| DeviantArt user | Own profile and preferences (account limitations are read-only), Make a request (when allowed by `a_postreq`), voting, personal guide list; the "Pending reservations" section shows the explanation instead of a list |
| Club member | Reserve requests, Make a reservation, finish / cancel own reservations, Check (accept) own finished posts, "Vectors waiting for approval" with Check, Request Roulette's Reserve button, Personal Color Guide (slots by points), sidebar Discord link settings |
| Staff level (assistant, staff, admin) | Admin area, logs, notices, useful links, PCG appearance list; add / edit / delete anywhere (guide, tags, shows, posts, events); approve and unlock posts; "Add a reservation" for others; change roles of lower users (`canEdit`), give / take PCG points; contributions of others' requests; edit reservation texts; staff-only prefs (hide synonym tags), account limitations Save buttons; account page Security section (e-mail and password); synonym tags in lists; open submissions links |
| Developer | Everything above plus: Elasticsearch status, re-index / export / stat cache, WS and diagnose pages, "Reserve as" and timestamp fields on post forms, change the displayed developer role, session user agent and debug, point history recalculation, DeviantArt / Discord IDs under the role, edit timestamps of posts |

Assistant, staff and admin differ only in their label and in which roles they may assign; capture all three anyway.

## Status legend

✅ matches · 🟡 present but different · ❌ missing · ⛔ intentionally not ported

## Page by page (first audit, 2026-10-05, production copy)

| Page | Old URL | Celestia URL | Gaps found | Status |
|---|---|---|---|---|
| Guide list `/cg` | `/cg` | `/cg` | JSON export link, API link text, "your settings" notice for guests | 🟡 |
| Guide `/cg/pony` | `/cg/pony` | same | list items: sprite thumbnail, tag links (colored by type), per-item buttons (open image, view as PNG, download swatch file, staff edit / pin / unpin / delete), "last major change", pagination (page links, 60 pages), JSON export link, search form (ElasticSearch up) | ❌ |
| Full list | `/cg/pony/full` | same | cards link text includes "AKA" and age, sort control as links, staff reorder | 🟡 |
| Major changes | `/cg/pony/changes` | same | pagination style | 🟡 |
| Tags | `/cg/tags` | `/cg/pony/tags` | URL, "Return to Color Guides" / "Major Changes" buttons, staff "Refresh use count" / "Refresh usage data on this page" | ✅ |
| Appearance | `/cg/pony/v/ID-Name` | `/cg/pony/v/ID` | canonical URL with the name, "Open image in new tab", "Download swatch file", "View as PNG", section layout | 🟡 |
| Blending calculator | `/cg/blending` | `/cg/blending` (old `/blending` redirects) | URL, heading ("Color Blending Calculator"), "Back to Color Guide", credit link | ✅ |
| Blending reverser | `/cg/blending-reverse` | `/cg/blending-reverse` (old `/blending-reverse` redirects) | URL | ✅ |
| Picker | `/cg/picker` | `/cg/picker` | (moved 2026-10-04) | 🟡 |
| Episode / movie | `/episode/...` | same | Share button, staff Unlock, icon-only actions, reserver avatar chip, "added by", approved date | 🟡 |
| Show list | `/show` | same | not yet compared | ❓ |
| Events | `/events`, `/event/ID-Title` | same | event page: description, entries layout, "Finished image", update; URL with title | 🟡 page layout done 2026-10-06 (heading, finished image, description, entry cards; Edit/Withdraw skipped, Luna answers 501); title in the URL left |
| Users | `/users` | same | not yet compared | ❓ |
| Profile | `/users/ID` | same | rebuilt 2026-10-05: briefing (DeviantArt / vector app / Discord logos, role + change role dialog), previous names, contributions (info, staff purge), personal guide (progress, list, View / Point history / Give points, "What?" dialog), pending reservations (Fix / View / Cancel, Request Roulette), vectors waiting for approval (View / Check), preferences with per-field Save. Open: dev role label button for developers, lazy loaded sections | 🟡 |
| Personal guide, point history | `/users/ID/cg...` | same | not yet compared | ❓ |
| Account | `/users/ID/account` | same | sections and labels (Security, Discord account, Create password, Set e-mail address, Sign out, Sync / Unlink, Reveal characters, link to security settings) | ❌ |
| Admin index | `/admin` | `/admin` | rebuilt 2026-10-05: button row, developer Elasticsearch status, 20 most recent posts. Not ported: Clear Stat Cache (deploys reload php-fpm), WS diagnostics | ✅ |
| Logs | `/admin/logs` | same | rebuilt: filter form (type select, user / IP / me / Web server), table like the old one, entry details as rows with the diff / new / old switch. Details are generic rows from Luna's structured data, not the old per type texts | 🟡 |
| Notices | `/admin/notices` | same | list with Hidden time and icon buttons, Create notice, Back | ✅ |
| Useful links | `/admin/usefullinks` | same (redirect from `/admin/useful-links`) | Add link, Re-order links (dialog with arrows, the old site drags), list with role and Edit / Delete | ✅ |
| PCG appearances | `/admin/pcg-appearances` | same | not yet compared | ❓ |
| About, privacy | `/about`, `/about/privacy` | same | about: "What's after the @ sign in the footer", GitHub / Discord / Loading.io / Pony Life links | 🟡 |

## Global (every page)

| Item | Status |
|---|---|
| Sidebar: useful links look, notifications ("Unread notifications"), sign out / sign in buttons, "Color Guide" copy-hash widget on guide pages, voting widget | ❓ |
| Footer: old site shows "Running Winterchilla@commit created N ago | API Docs | Privacy Policy | Contact Us" | 🟡 |
| Breadcrumbs, header navigation | ✅ (order matches, Events dropped on 2026-10-04) |
| "Work in progress" banner (Celestia only) | ⛔ remove at cutover |
| Responsive layout, mobile | ❓ |
| Dialogs (look and behavior): the old site's dialog component | ❓ |

## Interactions the label diff cannot see (inventory of the old page scripts, 2026-10-05)

The label diff only shows what is on the page. These behaviors live in `Winterchilla/assets/js` and each needs its own check (status after each item).

**Right-click menus** (`jquery.ctxmenu.js`: a small menu titled after the target, items with icons, one marked default; Shift+right-click keeps the browser's own menu). **Decision (user, 2026-10-05): no hidden context menus in Celestia.** Every action below is surfaced as a visible button or as an item of a "⋯" (three dot) menu (`ActionMenu`) on the thing it acts on:
- Color squares, guide list and appearance page (`guide.js`): *Copy HEX color code* (default, same as a click; the `#` follows the sidebar's "Copy # with color codes" toggle), *View RGB values* (same as Shift+click, a dialog with the path "Pony › Group › Color" and `rgb(r, g, b)`). Click copies and Shift+click shows the RGB values as before (the sidebar widget "Color Guide" explains it and has the "Copy # with color codes" checkbox, plus a "Show RGB values instead of copying" checkbox for touch screens). ✅ (`ColorSquare`, `ColorCopyWidget`, `RgbValuesDialog`, `useColorCopySettings`)
- Tags area of the appearance page, staff (`manage.jsx` 1217): *Create new tag*; each tag, titled "Tag: name": *Edit tag*, *Delete tag*, *Create new tag*. ✅ "⋯" menu after each tag and next to "Edit tags" (`TagStaffMenus`)
- Color groups of the appearance page and list items, staff/owner (`manage.jsx` 1322, 1394): menu on the whole list "Color groups": *Re-order color groups*, *Create new group*, *Apply template (if empty)*; on a group: *Edit color group*, *Delete color group*, *Re-order color groups*, *Create new group*. ✅ (all of these were already visible buttons on the appearance page)
- Sprite (`manage.jsx` 1485): *Open image in new tab* (default once there is a sprite), *Copy image URL*, *Upload new sprite* (default without a sprite). ✅ "⋯" menu on the sprite of the appearance page (`SpriteWrap`, also *Remove sprite image*); the guide list's sprite still lacks the *Open image in new tab* link ❌
- Admin logs, "view" switch button of a log entry (`log.js`): a click cycles the diff view (both / new / old), a right click cycles backwards: becomes a visible three way switch when the admin pages are compared. ❌
- Picker: right click zooms out with the zoom tool. ✅ (`usePointerTools`)

**Modifier clicks:** Shift+click on a color square shows its RGB values (❌); Shift+click on a "Reserve" button, developers only, opens "Reserve as" (user name and time): Luna's `POST /posts/{id}/reservation` has no on-behalf parameters, so this needs a Luna change first, then a visible "Reserve as…" item (❌, low priority, developer tool); Shift+click on a blending calculator cell opens the RGB entry (✅ `RgbEntryDialog`); Alt+click in the picker (✅).

**Keyboard:** the picker's shortcuts (✅), Enter / arrow keys in the tag input with autocomplete (`manage.jsx` 1884), the color palette widget's arrow keys (`jquery.ponycolorpalette.js`), dirty tracking of the account page's settings form (`profile.js` 254, the Save button only enables after a change). ❓

**Clipboard:** copy for colors, URLs and share links (🟡), paste of colors and images into the hex inputs, blending calculator, reverser, picker and post image URL fields (`global.jsx`, `blending*.js`, `show/view.js`). ❓

**Drag and drop / sorting:** sprite upload zone (drop a PNG onto the sprite, `jquery.uploadzone.js`) ❌; full list re-order (✅ `FullGuideReorder`); useful links order (🟡 arrows only); color group order (✅ dialog).

**Lazy loading with IntersectionObserver:** episode posts (✅ built 2026-10-05), event entries, contributions lists, profile sections, full list previews, admin "most recent posts". ❓

**Persistence (`localStorage`):** the copy-hash toggle (`leavehash`), picker settings (✅), guide sprite template state. ❓

**Live updates (`websocket.js`):** new notifications and post changes arrive without a reload; Luna has no WebSocket server, so this stays out unless the user decides otherwise. ⛔

**Autocomplete:** appearance search box, tag input, profile/user fields, show appearance linking, blending reverser colors. ❓

## Working order

1. Guide list item and pagination (used by `/cg/pony`, search, pinned appearances).
2. Appearance page.
3. Profile and account pages, admin index.
4. Remaining admin pages, tags, full list, changes.
5. Blending / picker URLs, about, events, users, show list.
6. Global sidebar and footer, dialogs, mobile.
7. Behavior: go through every button of the old site's page scripts (`assets/js/pages`) and check that Celestia has the same action.

## URL inventory (2026-10-06)

Every route of Winterchilla's `config/routes/pages.php` was probed against Celestia (dev server, old-style URLs with made-up ids). Old URLs keep working through `next.config.js`:
- Redirects: `/blending(-reverse)`, `/picker`, page numbers in paths, `/browser` and `/about/browser/*` (→ `/about/connection`, the connection info page), `/admin/wsdiag` (→ `/admin`), `/components` (→ `/`), `/da-auth/end` and `/discord-connect/end` (→ `/oauth/{provider}`, query kept), the other `/da-auth/*` and `/discord-connect/*` (→ `/`), `/users/{id}/cg/{page}`.
- Rewrites to Luna: appearance exports (`.json .gpl .png p.svg f.svg`) for `/cg/{guide}/v/`, `/cg/v/` and `/users/{id}/cg/v/`, cutie marks `/cg/cutiemark/{id}.svg` and `/cg/cutiemark/download/{id}` (Luna `GET /cutie-marks/{id}/image|download`).
- Nothing to port: `/cg/{guide}/tag-changes/{id}` was an unfinished page that always answered 404 on the old site (Luna has `GET /appearances/{id}/tag-changes` if it is ever wanted). Legacy `/s/r/{id}` forms are not supported (no legacy id mapping).
