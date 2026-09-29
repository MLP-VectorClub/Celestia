# Celestia

Work-in-progress SPA frontend for the [MLP-VectorClub](https://github.com/MLP-VectorClub)'s website

## Built with

- [TypeScript](https://www.typescriptlang.org/)
- [Next.js](https://github.com/zeit/next.js)
- [Redux-Toolkit](https://redux-toolkit.js.org/)
- [Sass](https://sass-lang.com/)
- [Bootstrap 5](https://getbootstrap.com/)
- [Reactstrap](https://reactstrap.github.io/)
- [Fontawesome Free](https://fontawesome.com/license/free)

## Production notes

Things about the production server that aren't obvious from the code. It's deployed with
[git-deploy-toolkit](https://github.com/WentTheFox/GitDeployToolkit) using the repo's `deploy.conf`.

- **Server-side requests reach the API over plain `http://` on purpose.** The server's `/etc/hosts`
  points `api.mlpvector.club` (and the other `*.mlpvector.club` names) at `127.0.0.1`, so these
  requests go to the local nginx and never leave the machine. That nginx serves a Cloudflare Origin CA
  certificate, which only Cloudflare trusts, so `https://api.mlpvector.club` fails from the server with
  `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Keep `NEXT_PUBLIC_BACKEND_HOST` (`apps/celestia/.env`) and
  `API_JSON_PATH` (`packages/api-types/.env`) on `http://`.
- **`NEXT_PUBLIC_FRONTEND_HOST` must be the public `https://` URL.** Canonical links, `og:` tags and
  share links are built from it.
- **`.env.local` overrides `.env`.** Keep production settings in `.env` only, so a leftover line in
  `.env.local` can't silently win.
- **`NEXT_PUBLIC_*` values are baked in at build time**, so changing one needs a rebuild. `.env` files
  are Turborepo build inputs, so redeploying after editing them rebuilds instead of reusing the cache.
- **The deploy directory isn't a git repository.** `deploy.conf` passes the deployed commit to the build
  as `BUILD_GIT_INFO`, which becomes the build ID shown in the footer.
