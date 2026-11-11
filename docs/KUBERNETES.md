# Running Celestia in the cluster

- Image `ghcr.io/mlp-vectorclub/celestia:sha-<sha7>` (amd64 + arm64), one Node process per pod, non-root, logs to stdout/stderr.
- Port `6900` (`PORT`), listens on `HOSTNAME` (0.0.0.0). Probe: `GET /api/health` on the pod (200 `{"status":"ok"}`, does not call Luna).
  That path is only for probes: the public `/api/` is routed to Luna by the ingress.
- Runtime variable: `SESSION_COOKIE` (name of Luna's session cookie, not secret). Optional `NODE_OPTIONS=--use-openssl-ca`.
- Build arguments (`NEXT_PUBLIC_FRONTEND_HOST`, `NEXT_PUBLIC_BACKEND_HOST`, `NEXT_PUBLIC_API_PREFIX`, `NEXT_PUBLIC_CDN_DOMAIN`,
  `NEXT_PUBLIC_WS_HOST`, `BUILD_GIT_INFO`): inlined into the bundles and the rewrites, so changing them means a new image.
- Ingress: `/api/*` -> Luna with the `/api` prefix removed, `/dist/*` -> Winterchilla's `public/dist` (except `/dist/mlpvc-colorguide.json`,
  which Celestia rewrites to Luna's `/color-guide/export`; its own `public/dist` holds the schema and the swatch script), everything else -> Celestia.
  Forward `X-Real-IP` / `X-Forwarded-For` (the visitor's address is passed on to Luna's throttle).
- Stateless, no volumes, safe to run any number of replicas.
