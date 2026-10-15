import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHoneypot } from './index';

const honeypot = createHoneypot({ globs: ['/.env', '/wp-admin/**'], apiHost: 'https://luna.test', appHost: 'https://front.test' });
const request = (cookie?: string, url = 'https://front.test/cg/pony') => new NextRequest(url, { headers: cookie ? { cookie } : {} });

describe('honeypot proxy', () => {
  const luna = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();

  beforeEach(() => {
    luna.mockReset();
    vi.stubGlobal('fetch', luna);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('refuses a session that Luna says touched a honeypot, whatever else the browser sends', async () => {
    luna.mockResolvedValue(new Response('Forbidden', { status: 403 }));
    const response = await honeypot.proxy(request('luna_session=flagged-a; blocked=0'));
    expect(response?.status).toBe(403);
    expect(await response?.text()).toBe('Forbidden');
    expect(luna.mock.calls[0][0]).toBe('https://luna.test/internal/session-status');
    expect(luna.mock.calls[0][1].headers).toMatchObject({ cookie: 'luna_session=flagged-a', referer: 'https://front.test' });
  });

  it('lets a session in good standing through, and does not ask again right away', async () => {
    luna.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await honeypot.proxy(request('luna_session=fine'))).toBeNull();
    expect(await honeypot.proxy(request('luna_session=fine'))).toBeNull();
    expect(luna).toHaveBeenCalledTimes(1);
  });

  it('remembers a flagged session so the next request is refused without asking', async () => {
    luna.mockResolvedValue(new Response('Forbidden', { status: 403 }));
    await honeypot.proxy(request('luna_session=flagged-b'));
    expect((await honeypot.proxy(request('luna_session=flagged-b')))?.status).toBe(403);
    expect(luna).toHaveBeenCalledTimes(1);
  });

  it('has nothing to ask about for a visitor without a session cookie', async () => {
    expect(await honeypot.proxy(request())).toBeNull();
    expect(await honeypot.proxy(request('other=1'))).toBeNull();
    expect(luna).not.toHaveBeenCalled();
  });

  it('does not take a cookie of the browser for the answer', async () => {
    luna.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await honeypot.proxy(request('luna_session=fine-c; blocked=1'))).toBeNull();
  });

  it('lets everybody in while Luna cannot be reached', async () => {
    luna.mockRejectedValue(new Error('down'));
    expect(await honeypot.proxy(request('luna_session=whoever'))).toBeNull();
  });

  it('springs a trap: Luna flags the session, its session cookie goes back to the visitor, and the next request is known without asking', async () => {
    luna.mockResolvedValue(new Response('Forbidden', { status: 403, headers: { 'set-cookie': 'luna_session=started; Path=/; HttpOnly' } }));
    const headers = { 'x-forwarded-for': '203.0.113.9, 10.0.0.1', 'user-agent': 'scanner/1.0' };
    const response = await honeypot.proxy(new NextRequest('https://front.test/.env', { headers }));
    expect(response?.status).toBe(403);
    expect(response?.headers.getSetCookie()).toEqual(['luna_session=started; Path=/; HttpOnly']);
    expect(luna.mock.calls[0][0]).toBe('https://luna.test/honeypot/.env');
    expect(luna.mock.calls[0][1].headers).toMatchObject({ 'x-forwarded-for': '203.0.113.9', 'user-agent': 'scanner/1.0' });

    luna.mockClear();
    expect((await honeypot.proxy(request('luna_session=started')))?.status).toBe(403);
    expect(luna).not.toHaveBeenCalled();
  });

  it('refuses a trap even while Luna cannot be reached', async () => {
    luna.mockRejectedValue(new Error('down'));
    expect((await honeypot.proxy(new NextRequest('https://front.test/wp-admin/setup-config.php')))?.status).toBe(403);
  });
});
