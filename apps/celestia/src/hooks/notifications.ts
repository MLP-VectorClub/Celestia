import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useConfig } from 'src/hooks/content';
import { AccountService } from 'src/services/account';

export const NOTIFICATIONS_KEY = '/notifications';
/** Whether the websocket connection that announces new notifications is up, kept in the query cache so that the polling can calm down while it is */
const SOCKET_CONNECTED_KEY = ['notification-socket-connected'];
const POLL_WITHOUT_SOCKET_MS = 60e3;
const POLL_WITH_SOCKET_MS = 5 * 60e3;
/** How long a socket that Luna's token was refused for (or that cannot connect) is left alone before the next try */
const RETRY_AFTER_REFUSAL_MS = 30e3;

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
 * The old site's websocket connection (Muffins): it tells the browser that its notifications changed the moment a notification is sent or read
 * somewhere else, instead of waiting for the next poll. Does nothing when Luna names no websocket server; a server that is down just leaves the polling.
 */
export function useNotificationSocket(enabled: boolean) {
  const queryClient = useQueryClient();
  const { config } = useConfig();
  const host = config?.wsServerHost;

  useEffect(() => {
    if (!enabled || !host) return undefined;

    let cancelled = false;
    let disconnect: VoidFunction = () => undefined;
    const setConnected = (value: boolean) => queryClient.setQueryData(SOCKET_CONNECTED_KEY, value);

    // Loaded when it is needed: visitors without an account or a websocket server never download the client
    void import('socket.io-client').then(({ io }) => {
      if (cancelled) return;

      const socket = io(host, {
        reconnectionDelay: 10e3,
        // Every connection, the first and each reconnection, proves who it is with a new one time token. Without one the server treats it as a guest
        auth: (callback) => {
          AccountService.getSocketToken()
            .then((response) => callback({ token: response.data.token }))
            .catch(() => callback({}));
        },
      });
      let retry: ReturnType<typeof setTimeout> | undefined;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));
      // The server did not accept the token: the visitor is a guest for it, so it has nothing to say to them. Try again later with a fresh token
      socket.on('auth-guest', () => {
        setConnected(false);
        socket.disconnect();
        retry = setTimeout(() => !cancelled && socket.connect(), RETRY_AFTER_REFUSAL_MS);
      });
      socket.on('auth', () => setConnected(true));
      socket.on('notif-cnt', () => void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }));

      disconnect = () => {
        clearTimeout(retry);
        socket.disconnect();
      };
    });

    return () => {
      cancelled = true;
      disconnect();
      setConnected(false);
    };
  }, [enabled, host, queryClient]);
}
