# UI parity plan: Celestia looks and acts like Winterchilla

**Goal (user, 2026-10-05):** a full recreation that works as close to identically to the old site as possible, with every button and link
performing the same action as before. This file is the working plan: update the status columns as work lands and commit it with the code.
It complements `winterchilla-parity-plan.md` (data and features through the API) with the look, layout and behavior of every page.

## Method

1. **Same data in both sites.** Real data gives far better comparisons than the contract seed (which has no color groups or sprites).
   - Winterchilla on the production copy: `TEST_MODE=true TEST_DB_NAME=prod_copy DB_NAME=prod_copy APP_URL=http://127.0.0.1:8768 PHP_CLI_SERVER_WORKERS=4 php -d variables_order=EGPCS -d opcache.revalidate_freq=0 -S 127.0.0.1:8768 -t public` (in `Winterchilla`; `prod_copy` is a local scratch copy of a production dump, keep it out of git).
   - Luna on the same data: `DB_DATABASE=luna_import php artisan migrate --force`, then Luna's contract server command (`scripts/serve-contract.sh`) with `DB_DATABASE=luna_import` on :8766, reindex Elasticsearch (`POST /color-guide/reindex` as a developer, user 1), import sprites with `LARAVEL_STORAGE_PATH=<scratch> php artisan fs:migrate <Winterchilla/fs> 1 --wipe`, serve `<scratch>/app/public` as `public/cdn` and start Luna with `CDN_URL=http://127.0.0.1:8766/cdn` and the same `LARAVEL_STORAGE_PATH` (remove the symlink afterwards, it is untracked).
   - Celestia: `scripts/serve-ui-test-instance.sh` (http://localhost:3000, needs Luna on :8766).
2. **Capture** both sites, as guest and as admin (user 136), for every page in the table below: `node scripts/ui-audit/capture.mjs <out dir> [page,page] [guest,admin]` writes a full page screenshot per page, site and role plus `inventory.json` (headings, links, buttons and inputs of the main column).
3. **Diff the labels:** `scripts/ui-audit/diff.py <out dir> [page ...]` lists headings, links, buttons and inputs that exist on one site only. Then look at the two screenshots of the page and read the old Twig template (`Winterchilla/templates`), its scss (`assets/scss`) and its page script (`assets/js/pages`) for what the elements do.
4. **Fix** the page, rebuild the instance, capture again. The Winterchilla UI tests (`Winterchilla/scripts/ui-test-celestia.sh`) must stay green.
5. Things that the old site's page scripts do on their own (a test session is signed out again when the DeviantArt refresh fails) are why the capture script signs in before every page.

Old site's computed colors: link button `#337287` on `#e1edf2` text, ribbons blue `#0070e9`, orange `#bb4400`, green `#008000`, dark blue `#0022aa`, grey `#ccc`.

## Status legend

✅ matches · 🟡 present but different · ❌ missing · ⛔ intentionally not ported

## Page by page (first audit, 2026-10-05, production copy)

| Page | Old URL | Celestia URL | Gaps found | Status |
|---|---|---|---|---|
| Guide list `/cg` | `/cg` | `/cg` | JSON export link, API link text, "your settings" notice for guests | 🟡 |
| Guide `/cg/pony` | `/cg/pony` | same | list items: sprite thumbnail, tag links (colored by type), per-item buttons (open image, view as PNG, download swatch file, staff edit / pin / unpin / delete), "last major change", pagination (page links, 60 pages), JSON export link, search form (ElasticSearch up) | ❌ |
| Full list | `/cg/pony/full` | same | cards link text includes "AKA" and age, sort control as links, staff reorder | 🟡 |
| Major changes | `/cg/pony/changes` | same | pagination style | 🟡 |
| Tags | `/cg/tags` | `/cg/pony/tags` | URL, "Return to Color Guides" / "Major Changes" buttons, staff "Refresh use count" / "Refresh usage data on this page" | 🟡 |
| Appearance | `/cg/pony/v/ID-Name` | `/cg/pony/v/ID` | canonical URL with the name, "Open image in new tab", "Download swatch file", "View as PNG", section layout | 🟡 |
| Blending calculator | `/cg/blending` | `/blending` | URL, heading ("Color Blending Calculator"), "Back to Color Guide", credit link | 🟡 |
| Blending reverser | `/cg/blending-reverse` | `/blending-reverse` | URL | 🟡 |
| Picker | `/cg/picker` | `/cg/picker` | (moved 2026-10-04) | 🟡 |
| Episode / movie | `/episode/...` | same | Share button, staff Unlock, icon-only actions, reserver avatar chip, "added by", approved date | 🟡 |
| Show list | `/show` | same | not yet compared | ❓ |
| Events | `/events`, `/event/ID-Title` | same | event page: description, entries layout, "Finished image", update; URL with title | 🟡 |
| Users | `/users` | same | not yet compared | ❓ |
| Profile | `/users/ID` | same | sections (Personal, Color Guide, Episode pages, Pending reservations, Vectors waiting for approval, Preferences, Account limitations), buttons (Go to account settings, View personal color guide, Point history, Give points, change role) | ❌ |
| Personal guide, point history | `/users/ID/cg...` | same | not yet compared | ❓ |
| Account | `/users/ID/account` | same | sections and labels (Security, Discord account, Create password, Set e-mail address, Sign out, Sync / Unlink, Reveal characters, link to security settings) | ❌ |
| Admin index | `/admin` | `/admin` | the page has buttons (Logs, Notices, PCG appearances, Useful links), "20 most recent posts" with View, developer tools | ❌ |
| Logs | `/admin/logs` | same | filter form (type, user IP), "Back to admin area" | 🟡 |
| Notices | `/admin/notices` | same | "Create notice", "Back to admin area", list layout | 🟡 |
| Useful links | `/admin/usefullinks` | `/admin/useful-links` | URL, "Add link", "Re-order links", list of the sidebar's links | 🟡 |
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

## Working order

1. Guide list item and pagination (used by `/cg/pony`, search, pinned appearances).
2. Appearance page.
3. Profile and account pages, admin index.
4. Remaining admin pages, tags, full list, changes.
5. Blending / picker URLs, about, events, users, show list.
6. Global sidebar and footer, dialogs, mobile.
7. Behavior: go through every button of the old site's page scripts (`assets/js/pages`) and check that Celestia has the same action.
