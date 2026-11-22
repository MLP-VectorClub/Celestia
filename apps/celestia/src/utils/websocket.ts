import type { Socket } from 'socket.io-client';

import { AccountService } from 'src/services/account';
import { isStatsOptedOut } from 'src/utils/stats-opt-out';

/** How long a socket that Luna's token was refused for is left alone before the next try */
const RETRY_AFTER_REFUSAL_MS = 30e3;

interface Shared {
  host: string;
  socket: Socket;
  users: number;
  retry?: ReturnType<typeof setTimeout>;
}

/** The Next.js route name of the page being viewed (`/users/[user]/cg`), see `announcePage` */
let currentRoute: string | null = null;

let shared: Shared | null = null;
let loading: Promise<Shared> | null = null;

/** Tells the server in the handshake that this visitor opted out of the visitor statistics (the server then leaves the connection out of them) */
const optOutAuth = () => (isStatsOptedOut() ? { optOut: true } : {});

/**
 * Starts the open connection over so the server hears the visitor's current statistics choice at once (it only reads it in the handshake)
 */
export function reconnectSocket() {
  if (!shared?.socket.connected) return;
  shared.socket.disconnect();
  shared.socket.connect();
}

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
            .then((response) => callback({ token: response.data.token, ...optOutAuth() }))
            .catch(() => callback({ ...optOutAuth() }));
        },
      });
      const created: Shared = { host, socket, users: 0 };
      // The server did not accept the token: the visitor is a guest for it. Try again later with a fresh token
      socket.on('auth-guest', () => {
        socket.disconnect();
        created.retry = setTimeout(() => created.users > 0 && socket.connect(), RETRY_AFTER_REFUSAL_MS);
      });
      socket.on('connect', () => currentRoute && socket.emit('navigate', { page: currentRoute, route: true }));
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

/**
 * Tells the server which page the visitor is on, by the page's route name (`/cg/[guide]`) and never its address: no ids, user names, search terms or
 * anchors reach the server. It is remembered and sent again whenever the connection is made, and is what the (anonymous) statistics group by.
 */
export const announcePage = (socket: Socket, route: string) => {
  currentRoute = route;
  if (socket.connected) socket.emit('navigate', { page: route, route: true });
};

/** Records the route before a connection exists, so that it is announced as soon as there is one */
export const rememberRoute = (route: string) => {
  currentRoute = route;
};
