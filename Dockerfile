# Celestia (Next.js, standalone output), one process per container: Kubernetes replicas replace the old pm2 cluster.
#
# NEXT_PUBLIC_* values are inlined into the browser AND the server bundles, and the rewrites in next.config.js are
# evaluated at build time, so they are build arguments (public addresses, not secrets). Nothing secret is baked in.
# Runtime variables: PORT, HOSTNAME (listen address), SESSION_COOKIE.
FROM node:24-bookworm-slim AS build
RUN npm install -g pnpm@11.28.6
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/celestia/package.json apps/celestia/
COPY packages packages
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY apps apps

ARG NEXT_PUBLIC_FRONTEND_HOST=https://mlpvector.club
ARG NEXT_PUBLIC_BACKEND_HOST=https://api.mlpvector.club
ARG NEXT_PUBLIC_API_PREFIX=/api
ARG NEXT_PUBLIC_CDN_DOMAIN=mlpvcdn.top
# The websocket server that pushes notifications (Muffins). The CSP's connect-src is built from it at build time, so without it the browsers'
# connections to it are blocked; it is what Luna's /config advertises as wsServerHost
ARG NEXT_PUBLIC_WS_HOST=https://ws.mlpvector.club:8443
# "<short commit>;<commit unix time>", the build ID the footer shows (see next.config.js)
ARG BUILD_GIT_INFO=
ENV NEXT_PUBLIC_FRONTEND_HOST=$NEXT_PUBLIC_FRONTEND_HOST \
    NEXT_PUBLIC_BACKEND_HOST=$NEXT_PUBLIC_BACKEND_HOST \
    NEXT_PUBLIC_API_PREFIX=$NEXT_PUBLIC_API_PREFIX \
    NEXT_PUBLIC_CDN_DOMAIN=$NEXT_PUBLIC_CDN_DOMAIN \
    NEXT_PUBLIC_WS_HOST=$NEXT_PUBLIC_WS_HOST \
    BUILD_GIT_INFO=$BUILD_GIT_INFO \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @mlp-vectorclub/celestia build

FROM node:24-bookworm-slim AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=6900 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/celestia/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/celestia/.next/static apps/celestia/.next/static
COPY --from=build --chown=node:node /app/apps/celestia/public apps/celestia/public
USER node
EXPOSE 6900
WORKDIR /app/apps/celestia
CMD ["node", "server.js"]
