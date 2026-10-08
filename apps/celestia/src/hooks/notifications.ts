import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useConfig } from 'src/hooks/content';
import { AccountService } from 'src/services/account';
import { acquireSocket, announcePage } from 'src/utils/websocket';

export const NOTIFICATIONS_KEY = '/notifications';
/** Whether the websocket connection that announces new notifications is up, kept in the query cache so that the polling can calm down while it is */
const SOCKET_CONNECTED_KEY = ['notification-socket-connected'];
const POLL_WITHOUT_SOCKET_MS = 60e3;
const POLL_WITH_SOCKET_MS = 5 * 60e3;

const useSocketConnected = (): boolean =>
  useQuery({ queryKey: SOCKET_CONNECTED_KEY, queryFn: () => false, enabled: false, initialData: false, staleTime: Infinity }).data;

/**
 * The signed in visitor's unread notifications. They are fetched again when the websocket server announces a change ({@see useNotificationSocket}),
 * and by polling: every minute, or every five while the socket is connected (it is the safety net for a missed message)
 */
export function useNotifications(enabled: boolean) {
  const connected = useSocketConnected();
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: () => AccountService.getNotifications().then((r) => r.data.notifications),
    enabled,
    refetchInterval: connected ? POLL_WITH_SOCKET_MS : POLL_WITHOUT_SOCKET_MS,
  });
}

/**
 * The old site's websocket connection (Muffins, {@see acquireSocket}): it tells the browser that its notifications changed the moment a notification
 * is sent or read somewhere else, instead of waiting for the next poll. Also reports the page the visitor is on, for the developer diagnostics.
 * Does nothing when Luna names no websocket server; a server that is down just leaves the polling.
 */
export function useNotificationSocket(enabled: boolean) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { config } = useConfig();
  const host = config?.wsServerHost;

  useEffect(() => {
    if (!enabled || !host) return undefined;

    let cancelled = false;
    let cleanup: VoidFunction = () => undefined;
    const setConnected = (value: boolean) => queryClient.setQueryData(SOCKET_CONNECTED_KEY, value);

    acquireSocket(host)
      .then(({ socket, release }) => {
        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        const onRefusal = () => setConnected(false);
        const onCount = () => void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
        const onRoute = (url: string) => announcePage(socket, url);
        socket.on('connect', onConnect);
        socket.on('auth', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('auth-guest', onRefusal);
        socket.on('notif-cnt', onCount);
        router.events.on('routeChangeComplete', onRoute);
        setConnected(socket.connected);

        cleanup = () => {
          socket.off('connect', onConnect);
          socket.off('auth', onConnect);
          socket.off('disconnect', onDisconnect);
          socket.off('auth-guest', onRefusal);
          socket.off('notif-cnt', onCount);
          router.events.off('routeChangeComplete', onRoute);
          release();
        };
        if (cancelled) cleanup();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      cleanup();
      setConnected(false);
    };
  }, [enabled, host, queryClient, router.events]);
}
