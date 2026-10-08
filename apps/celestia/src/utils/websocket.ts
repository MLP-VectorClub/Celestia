import type { Socket } from 'socket.io-client';

import { AccountService } from 'src/services/account';

/** How long a socket that Luna's token was refused for is left alone before the next try */
const RETRY_AFTER_REFUSAL_MS = 30e3;

interface Shared {
  host: string;
  socket: Socket;
  users: number;
  retry?: ReturnType<typeof setTimeout>;
}

let shared: Shared | null = null;
let loading: Promise<Shared> | null = null;

/**
 * The one websocket connection (to the old site's Muffins server) that notifications and the developer diagnostics page share.
 * Every connection, the first and each reconnection, proves who it is with a new one time token; without one the server treats it as a guest.
 * The `socket.io-client` library is only downloaded when something asks for the connection.
 */
export async function acquireSocket(host: string): Promise<{ socket: Socket; release: VoidFunction }> {
  if (shared && shared.host !== host) throw new Error('The websocket host changed while connected');
  if (!shared) {
    loading ??= import('socket.io-client').then(({ io }) => {
      const socket = io(host, {
        reconnectionDelay: 10e3,
        auth: (callback) => {
          AccountService.getSocketToken()
            .then((response) => callback({ token: response.data.token }))
            .catch(() => callback({}));
        },
      });
      const created: Shared = { host, socket, users: 0 };
      // The server did not accept the token: the visitor is a guest for it. Try again later with a fresh token
      socket.on('auth-guest', () => {
        socket.disconnect();
        created.retry = setTimeout(() => created.users > 0 && socket.connect(), RETRY_AFTER_REFUSAL_MS);
      });
      socket.on('connect', () => socket.emit('navigate', { page: `${location.pathname}${location.search}${location.hash}` }));
      shared = created;
      return created;
    });
  }
  const connection = await loading!;
  connection.users++;

  let released = false;
  return {
    socket: connection.socket,
    release: () => {
      if (released) return;
      released = true;
      if (--connection.users > 0) return;
      clearTimeout(connection.retry);
      connection.socket.disconnect();
      shared = null;
      loading = null;
    },
  };
}

/** Tells the server which page the visitor is on (the diagnostics list it) */
export const announcePage = (socket: Socket, url: string) => {
  if (socket.connected) socket.emit('navigate', { page: url });
};
