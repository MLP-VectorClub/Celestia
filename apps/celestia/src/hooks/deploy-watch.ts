import { useEffect, useState } from 'react';
import { Router } from 'next/router';

const HEALTH_CHECK_PATH = '/favicon.ico';
const POLL_INTERVAL_MS = 4000;

const isChunkLoadError = (error: unknown): boolean => {
  if (!error) return false;
  const err = error as { name?: string; message?: string };
  const message = err.message || String(error);
  return err.name === 'ChunkLoadError' || /loading (chunk|css chunk) .+ failed/i.test(message);
};

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

  useEffect(() => {
    const flag = () => setUnreachable(true);

    const onRouteChangeError = (err: Error & { cancelled?: boolean }) => {
      if (err.cancelled) return;
      flag();
    };
    const onWindowError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error) || isChunkLoadError({ message: event.message })) flag();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) flag();
    };

    Router.events.on('routeChangeError', onRouteChangeError);
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      Router.events.off('routeChangeError', onRouteChangeError);
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  useEffect(() => {
    if (!unreachable) return undefined;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(HEALTH_CHECK_PATH, { method: 'HEAD', cache: 'no-store' });
        if (res.ok) window.location.reload();
      } catch {
        // still down, keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, [unreachable]);

  return unreachable;
};
