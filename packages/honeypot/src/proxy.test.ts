import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHoneypot } from './index';

const honeypot = createHoneypot({
  traps: [{ glob: '/.env', decoy: 'env' }, { glob: '/wp-login.php', decoy: 'wordpress-login' }, '/wp-admin/**'],
  siteName: 'Test Site',
  apiHost: 'https://luna.test',
  appHost: 'https://front.test',
});
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

  it("asks in the visitor's name, so the session does not end up listing the server as the user agent", async () => {
    luna.mockResolvedValue(new Response(null, { status: 204 }));
    await honeypot.proxy(
      new NextRequest('https://front.test/cg', {
        headers: { cookie: 'luna_session=named', 'user-agent': 'Firefox/157.0', 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
      })
    );
    expect(luna.mock.calls[0][1].headers).toMatchObject({ 'user-agent': 'Firefox/157.0', 'x-forwarded-for': '203.0.113.5' });
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
    const response = await honeypot.proxy(new NextRequest('https://front.test/wp-admin/install.php', { headers }));
    expect(response?.status).toBe(403);
    expect(response?.headers.getSetCookie()).toEqual(['luna_session=started; Path=/; HttpOnly']);
    expect(luna.mock.calls[0][0]).toBe('https://luna.test/honeypot/wp-admin-any');
    expect(luna.mock.calls[0][1].headers).toMatchObject({ 'x-forwarded-for': '203.0.113.9', 'user-agent': 'scanner/1.0' });

    luna.mockClear();
    expect((await honeypot.proxy(request('luna_session=started')))?.status).toBe(403);
    expect(luna).not.toHaveBeenCalled();
  });

  it('refuses a trap even while Luna cannot be reached', async () => {
    luna.mockRejectedValue(new Error('down'));
    expect((await honeypot.proxy(new NextRequest('https://front.test/wp-admin/setup-config.php')))?.status).toBe(403);
  });

  describe('decoys', () => {
    beforeEach(() =>
      luna.mockResolvedValue(new Response('Forbidden', { status: 403, headers: { 'set-cookie': 'luna_session=decoyed; Path=/' } }))
    );

    it('answers a trap that names one with a real-looking 200 that anybody may cache', async () => {
      const response = await honeypot.proxy(new NextRequest('https://front.test/.env', { headers: { cookie: 'luna_session=known' } }));
      expect(response?.status).toBe(200);
      expect(response?.headers.get('content-type')).toMatch(/^text\/plain/);
      expect(response?.headers.get('cache-control')).toMatch(/^public, max-age=\d+, s-maxage=\d+/);
      const text = (await response?.text()) ?? '';
      expect(text).toMatch(/^APP_NAME="Test Site"$/m);
      expect(text).toMatch(/^APP_KEY=base64:[A-Za-z0-9+/]{43}=$/m);
      expect(text).toMatch(/^AWS_ACCESS_KEY_ID=AKIA[A-Z2-7]{16}$/m);
      expect(text).toMatch(/^DB_PASSWORD=[A-Za-z0-9]{22}$/m);
    });

    it('sets no cookie when a file answers, and has nothing to flag for a visitor without a session', async () => {
      const response = await honeypot.proxy(new NextRequest('https://front.test/.env'));
      expect(response?.status).toBe(200);
      expect(response?.headers.getSetCookie()).toEqual([]);
      expect(response?.headers.get('set-cookie')).toBeNull();
      expect(luna).not.toHaveBeenCalled();
    });

    it('flags the session a visitor asking for a file already has, without handing a cookie back', async () => {
      const response = await honeypot.proxy(new NextRequest('https://front.test/.env', { headers: { cookie: 'luna_session=theirs' } }));
      expect(response?.status).toBe(200);
      expect(response?.headers.getSetCookie()).toEqual([]);
      expect(luna.mock.calls[0][0]).toBe('https://luna.test/honeypot/.env');
      luna.mockClear();
      expect((await honeypot.proxy(new NextRequest('https://front.test/', { headers: { cookie: 'luna_session=theirs' } })))?.status).toBe(
        403
      );
      expect(luna).not.toHaveBeenCalled();
    });

    it('is over the top: dozens of services nobody runs on one site, jokes, and a note at the end that gives it away to whoever reads that far', async () => {
      const text = (await (await honeypot.proxy(new NextRequest('https://front.test/.env')))?.text()) ?? '';
      const keys = text.split('\n').filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line));
      expect(keys.length).toBeGreaterThan(120);
      [
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'TWILIO_AUTH_TOKEN',
        'STRIPE_SECRET',
        'SLACK_BOT_TOKEN',
        'MONGODB_URI',
        'BITCOIN_WALLET_SEED_PHRASE',
        'NUCLEAR_LAUNCH_CODES',
      ].forEach((key) => expect(text).toMatch(new RegExp(`^${key}=`, 'm')));
      expect(text).toMatch(/random number generator/);
      expect(text).toMatch(/^# DO NOT COMMIT THIS FILE/m);
      // Nothing is empty and nothing has an unfilled template left in it
      expect(text).not.toMatch(/\$\{|undefined|NaN|\[object/);
      keys.forEach((line) => expect(line.split('=')[1]?.trim()).not.toBe(''));
    });

    it('gives the same secrets to everybody who asks until the server restarts', async () => {
      const first = await (await honeypot.proxy(new NextRequest('https://front.test/.env')))?.text();
      const second = await (await honeypot.proxy(new NextRequest('https://front.test/.env')))?.text();
      expect(first).toBe(second);
    });

    it('sets the session cookie of a page that answers (a login page), the way a real one would', async () => {
      const response = await honeypot.proxy(new NextRequest('https://front.test/wp-login.php'));
      expect(response?.headers.getSetCookie()).toEqual(['luna_session=decoyed; Path=/']);
    });

    it('serves a login page that works without the server, with its own CSP, a comic font and a classless stylesheet', async () => {
      const response = await honeypot.proxy(new NextRequest('https://front.test/wp-login.php'));
      expect(response?.status).toBe(200);
      expect(response?.headers.get('cache-control')).toMatch(/^public, /);
      const html = (await response?.text()) ?? '';
      expect(html).toContain('fonts.googleapis.com/css2?family=Comic+Neue');
      expect(html).toMatch(/cdn\.jsdelivr\.net\/npm\/water\.css@2\.1\.1\//);
      expect(html).toContain('name="log"');
      expect(html).toContain('name="pwd"');
      // The script that stops the form from posting is the only one the CSP lets run
      const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1] ?? '';
      expect(script).toContain("addEventListener('submit'");
      const hash = createHash('sha256').update(script).digest('base64');
      expect(response?.headers.get('content-security-policy')).toContain(`script-src 'sha256-${hash}'`);
    });
  });
});
