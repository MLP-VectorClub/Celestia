import { useEffect, useRef, useState } from 'react';

import { useConfig } from 'src/hooks/content';
import { acquireSocket } from 'src/utils/websocket';

export interface DiagnosticsClient {
  current: boolean;
  network: string | null;
  page?: string;
  /** The site the visitor connected from (the old site or this one) */
  origin?: string;
  connectedSince?: string;
  user: { id: string; name?: string; role?: string };
}

export type DiagnosticsState = 'checking' | 'connected' | 'disconnected' | 'unconfigured' | 'denied';

const POLL_MS = 1000;
const HISTORY = 6;
const QUERY_TIMEOUT_MS = 5000;

/**
 * Asks the websocket server for the list of connected clients every second (a developer only query), and measures how long it takes to answer.
 * `paused` holds the polling still, so that the list does not change under the mouse.
 */
export function useWebsocketDiagnostics(paused: boolean) {
  const { config } = useConfig();
  const host = config?.wsServerHost;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [state, setState] = useState<DiagnosticsState>(host ? 'checking' : 'unconfigured');
  const [clients, setClients] = useState<DiagnosticsClient[]>([]);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (!host) {
      if (config) setState('unconfigured');
      return undefined;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cleanup: VoidFunction = () => undefined;

    acquireSocket(host)
      .then(({ socket, release }) => {
        const poll = () => {
          if (cancelled) return;
          if (!socket.connected) {
            setState('disconnected');
            timer = setTimeout(poll, POLL_MS);
            return;
          }
          if (pausedRef.current) {
            timer = setTimeout(poll, 500);
            return;
          }
          const started = performance.now();
          socket
            .timeout(QUERY_TIMEOUT_MS)
            .emit(
              'devquery',
              { what: 'status' },
              (error: Error | null, response?: { success: boolean; clients?: Record<string, DiagnosticsClient> }) => {
                if (cancelled) return;
                if (error || !response?.success || !response.clients) {
                  // The server only answers developers, an unanswered query means this socket is not one (yet)
                  setState(error ? 'denied' : 'checking');
                } else {
                  setState('connected');
                  setClients(Object.values(response.clients));
                  setResponseTimes((times) => [...times, Math.round(performance.now() - started)].slice(-HISTORY));
                  setBeat((n) => n + 1);
                }
                timer = setTimeout(poll, POLL_MS);
              }
            );
        };
        const onDown = () => setState('disconnected');
        socket.on('disconnect', onDown);
        poll();
        cleanup = () => {
          clearTimeout(timer);
          socket.off('disconnect', onDown);
          release();
        };
        if (cancelled) cleanup();
      })
      .catch(() => !cancelled && setState('disconnected'));

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cleanup();
    };
  }, [host, config]);

  return { state, clients, responseTimes, beat };
}
