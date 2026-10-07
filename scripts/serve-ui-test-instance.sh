#!/usr/bin/env bash
# Builds Celestia into the build directory that is NOT being served, then restarts the browser test instance from it, so the running instance
# keeps working during the long build and is down only for the restart. Usage (anywhere): scripts/serve-ui-test-instance.sh
# The instance listens on http://localhost:3000 (Luna's contract server accepts session cookies from that front end only) and needs Luna's
# contract server (scripts/serve-contract.sh in Luna) on 127.0.0.1:8766. /test-login/{id} is on (E2E_TEST_LOGIN=1).
set -euo pipefail
cd "$(dirname "$0")/../apps/celestia"

STATE=.next-ui-current
CURRENT=$(cat "$STATE" 2>/dev/null || echo ".next-ui-b")
if [ "$CURRENT" = ".next-ui-a" ]; then NEXT_DIR=".next-ui-b"; else NEXT_DIR=".next-ui-a"; fi

export NEXT_PUBLIC_BACKEND_HOST="${NEXT_PUBLIC_BACKEND_HOST:-http://127.0.0.1:8766}"
export NEXT_PUBLIC_FRONTEND_HOST="${NEXT_PUBLIC_FRONTEND_HOST:-http://localhost:3000}"
export NEXT_PUBLIC_CDN_DOMAIN="${NEXT_PUBLIC_CDN_DOMAIN:-127.0.0.1}"
export NEXT_PUBLIC_API_PREFIX="${NEXT_PUBLIC_API_PREFIX:-/api}"
# The browser tests read console errors and warnings from window.__appConsoleErrors (src/components/TestConsoleCapture.tsx)
export NEXT_PUBLIC_CAPTURE_CONSOLE=1

echo "Building into $NEXT_DIR (the instance keeps serving $CURRENT meanwhile)"
rm -rf "$NEXT_DIR"
NEXT_DIST_DIR="$NEXT_DIR" pnpm build
git checkout -- next-env.d.ts tsconfig.json 2>/dev/null || true

echo "Restarting the instance from $NEXT_DIR"
fuser -k 3000/tcp >/dev/null 2>&1 || true
sleep 1
E2E_TEST_LOGIN=1 NEXT_DIST_DIR="$NEXT_DIR" setsid nohup pnpm exec next start -H 127.0.0.1 -p 3000 > "${TMPDIR:-/tmp}/celestia-ui-instance.log" 2>&1 &
echo "$NEXT_DIR" > "$STATE"
for _ in $(seq 1 30); do
  if curl -s -o /dev/null http://localhost:3000/show; then echo "Up on http://localhost:3000 (build $NEXT_DIR)"; exit 0; fi
  sleep 1
done
echo "The instance did not come up, see ${TMPDIR:-/tmp}/celestia-ui-instance.log" >&2
exit 1
