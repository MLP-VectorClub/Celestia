import { Router } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { isBuildAssetFailure, isChunkLoadError } from 'src/utils/chunk-errors';

const HEALTH_CHECK_PATH = '/favicon.ico';
const POLL_INTERVAL_MS = 4000;

/**
 * Detects the brief window where Celestia's own Next.js/pm2 process is
 * unreachable — a `pm2 reload` gap, or a JS chunk from a build that's
 * since been replaced on disk — by watching for failed client-side
 * navigations and chunk-load errors, then polls a cheap same-origin
 * request until the app responds again and reloads the page to pick up
 * the new build.
 */
export const useDeployWatcher = (): boolean => {
  const [unreachable, setUnreachable] = useState(false);
  // Where the visitor was going, so that the page that loads after the update is that one and not the one they were on
  const pendingUrl = useRef<string | null>(null);

  useEffect(() => {
    const flag = () => setUnreachable(true);

    const onRouteChangeStart = (url: string) => {
      pendingUrl.current = url;
    };
    const onRouteChangeDone = () => {
      pendingUrl.current = null;
    };
    const onRouteChangeError = (err: Error & { cancelled?: boolean }) => {
      if (err.cancelled) return;
      flag();
    };
    const onWindowError = (event: ErrorEvent | Event) => {
      const asError = event as ErrorEvent;
      if (isChunkLoadError(asError.error) || isChunkLoadError({ message: asError.message }) || isBuildAssetFailure(event.target)) flag();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) flag();
    };

    Router.events.on('routeChangeStart', onRouteChangeStart);
    Router.events.on('routeChangeComplete', onRouteChangeDone);
    Router.events.on('routeChangeError', onRouteChangeError);
    window.addEventListener('error', onWindowError, true);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      Router.events.off('routeChangeStart', onRouteChangeStart);
      Router.events.off('routeChangeComplete', onRouteChangeDone);
      Router.events.off('routeChangeError', onRouteChangeError);
      window.removeEventListener('error', onWindowError, true);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  useEffect(() => {
    if (!unreachable) return undefined;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(HEALTH_CHECK_PATH, { method: 'HEAD', cache: 'no-store' });
        if (res.ok) {
          if (pendingUrl.current) window.location.assign(pendingUrl.current);
          else window.location.reload();
        }
      } catch {
        // still down, keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, [unreachable]);

  return unreachable;
};
