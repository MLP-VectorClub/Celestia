import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountService } from 'src/services/account';

type Handler = (...args: unknown[]) => void;

class FakeSocket {
  handlers: Record<string, Handler[]> = {};
  connected = false;
  emitted: Array<[string, unknown]> = [];
  disconnect = vi.fn(() => void (this.connected = false));
  connect = vi.fn(() => void (this.connected = true));

  constructor(
    public host: string,
    public options: { auth: (cb: (data: object) => void) => void }
  ) {}

  on(event: string, handler: Handler) {
    (this.handlers[event] ??= []).push(handler);
    return this;
  }

  emit(event: string, payload?: unknown) {
    this.emitted.push([event, payload]);
    return this;
  }

  fire(event: string, ...args: unknown[]) {
    (this.handlers[event] ?? []).forEach((h) => h(...args));
  }
}

const sockets: FakeSocket[] = [];
vi.mock('socket.io-client', () => ({
  io: (host: string, options: FakeSocket['options']) => {
    const socket = new FakeSocket(host, options);
    sockets.push(socket);
    return socket;
  },
}));
vi.mock('src/services/account', () => ({ AccountService: { getSocketToken: vi.fn() } }));

// The module keeps one shared connection in module state, so every test starts from a fresh copy of it
const load = async () => {
  vi.resetModules();
  return import('src/utils/websocket');
};

beforeEach(() => {
  sockets.length = 0;
  vi.stubGlobal('location', { pathname: '/cg/pony', search: '?page=2', hash: '#p3' });
  vi.mocked(AccountService.getSocketToken).mockResolvedValue({ data: { token: 'one-time' } } as never);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('acquireSocket', () => {
  it('shares one connection between everybody that asks for it', async () => {
    const { acquireSocket } = await load();
    const [a, b] = await Promise.all([acquireSocket('https://ws.example'), acquireSocket('https://ws.example')]);
    expect(sockets).toHaveLength(1);
    expect(a.socket).toBe(b.socket);
  });

  it('disconnects only when the last user lets go, and a second release does nothing', async () => {
    const { acquireSocket } = await load();
    const a = await acquireSocket('https://ws.example');
    const b = await acquireSocket('https://ws.example');
    a.release();
    a.release();
    expect(sockets[0].disconnect).not.toHaveBeenCalled();
    b.release();
    expect(sockets[0].disconnect).toHaveBeenCalledTimes(1);

    // Asking again starts over with a new connection
    await acquireSocket('https://ws.example');
    expect(sockets).toHaveLength(2);
  });

  it('refuses another host while connected', async () => {
    const { acquireSocket } = await load();
    await acquireSocket('https://ws.example');
    await expect(acquireSocket('https://other.example')).rejects.toThrow(/host changed/);
  });

  it('proves who the visitor is with a fresh token on every connection', async () => {
    const { acquireSocket } = await load();
    await acquireSocket('https://ws.example');
    const callback = vi.fn();
    sockets[0].options.auth(callback);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledWith({ token: 'one-time' }));

    vi.mocked(AccountService.getSocketToken).mockResolvedValue({ data: { token: 'second' } } as never);
    sockets[0].options.auth(callback);
    await vi.waitFor(() => expect(callback).toHaveBeenLastCalledWith({ token: 'second' }));
  });

  it('connects as a guest when no token can be had', async () => {
    vi.mocked(AccountService.getSocketToken).mockRejectedValue(new Error('401'));
    const { acquireSocket } = await load();
    await acquireSocket('https://ws.example');
    const callback = vi.fn();
    sockets[0].options.auth(callback);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledWith({}));
  });

  it('tells the server which page the visitor is on when it connects', async () => {
    const { acquireSocket } = await load();
    await acquireSocket('https://ws.example');
    sockets[0].fire('connect');
    expect(sockets[0].emitted).toEqual([['navigate', { page: '/cg/pony?page=2#p3' }]]);
  });

  it('leaves a refused connection alone for 30 seconds, then tries again while somebody is still using it', async () => {
    vi.useFakeTimers();
    const { acquireSocket } = await load();
    await acquireSocket('https://ws.example');
    sockets[0].fire('auth-guest');
    expect(sockets[0].disconnect).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(29_000);
    expect(sockets[0].connect).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(sockets[0].connect).toHaveBeenCalledTimes(1);
  });

  it('does not retry once everybody has let go', async () => {
    vi.useFakeTimers();
    const { acquireSocket } = await load();
    const user = await acquireSocket('https://ws.example');
    sockets[0].fire('auth-guest');
    user.release();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sockets[0].connect).not.toHaveBeenCalled();
  });
});

describe('announcePage', () => {
  it('only speaks while connected', async () => {
    const { announcePage } = await load();
    const socket = new FakeSocket('x', { auth: () => undefined });
    announcePage(socket as never, '/a');
    expect(socket.emitted).toEqual([]);
    socket.connected = true;
    announcePage(socket as never, '/b');
    expect(socket.emitted).toEqual([['navigate', { page: '/b' }]]);
  });
});
