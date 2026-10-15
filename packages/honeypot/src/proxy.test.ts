import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHoneypot } from './index';

const honeypot = createHoneypot({
  traps: [
    { glob: '/.env', decoy: 'env' },
    { glob: '/wp-login.php', decoy: 'wordpress-login' },
    { glob: '/adminer', decoy: 'adminer-login' },
    { glob: '/phpmyadmin/**', decoy: 'phpmyadmin-login' },
    '/wp-admin/**',
  ],
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

    it('answers a trap that names one with a real-looking 200', async () => {
      const response = await honeypot.proxy(new NextRequest('https://front.test/.env', { headers: { cookie: 'luna_session=known' } }));
      expect(response?.status).toBe(200);
      expect(response?.headers.get('content-type')).toMatch(/^text\/plain/);
      expect(response?.headers.get('cache-control')).toMatch(/^private, max-age=\d+/);
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
      expect(text).toMatch(/^# DO NOT COMMIT THIS FILE/m);
      // The way out for whoever finds it: report it as the security policy says, which tells them what the file is
      const top = text.split('\n').slice(0, 4).join('\n');
      expect(top).toContain('Report it the way https://front.test/.well-known/security.txt says.');
      expect(text).not.toMatch(/Hello, scanner|random number generator/);
      expect(text.trimEnd().split('\n').pop()).toMatch(/^VISITOR_MOMS_WEIGHT_LBS=/);
      // Nothing is empty and nothing has an unfilled template left in it (the values are random, so a stray "NaN" inside one is not a failure)
      expect(text).not.toMatch(/\$\{|\[object Object\]|^[A-Z][A-Z0-9_]*=(undefined|NaN|null)$/m);
      keys.forEach((line) => expect(line.split('=')[1]?.trim()).not.toBe(''));
    });

    it("has wallets, fake certificates and keys, and a line about the visitor's mother that is the same for the same visitor and differs between visitors", async () => {
      const ask = async (address: string) =>
        (await (await honeypot.proxy(new NextRequest('https://front.test/.env', { headers: { 'x-forwarded-for': address } })))?.text()) ??
        '';
      const [a1, a2, b] = [await ask('203.0.113.1'), await ask('203.0.113.1'), await ask('198.51.100.7')];

      expect(a1).toMatch(/^ETHEREUM_WALLET_ADDRESS=0x[0-9a-f]{40}$/m);
      expect(a1).toMatch(/^ETHEREUM_PRIVATE_KEY=0x[0-9a-f]{64}$/m);
      expect(a1).toMatch(/^ETHEREUM_MNEMONIC="(\w+ ){23}\w+"$/m);
      for (const label of ['PRIVATE KEY', 'CERTIFICATE', 'OPENSSH PRIVATE KEY']) {
        expect(a1).toMatch(new RegExp(`-----BEGIN ${label}-----\\n[A-Za-z0-9+/\\n]{200,}\\n-----END ${label}-----`));
      }
      const weight = (text: string) => text.match(/^VISITOR_MOMS_WEIGHT_KG=(\d+\.\d)$/m)?.[1];
      expect(weight(a1)).toBeDefined();
      expect(Number(weight(a1))).toBeGreaterThan(120);
      expect(Number(weight(a1))).toBeLessThan(290);
      expect(weight(a1)).toBe(weight(a2));
      // The same weight in pounds, to the decimal
      const pounds = (text: string) => text.match(/^VISITOR_MOMS_WEIGHT_LBS=(\d+\.\d)$/m)?.[1];
      expect(pounds(a1)).toBeDefined();
      expect(Number(pounds(a1))).toBeCloseTo(Number(weight(a1)) * 2.2046226218, 0);
      expect(pounds(a1)).toBe(pounds(a2));
      expect(pounds(a1)).not.toBe(pounds(b));
      expect(a1).toBe(a2);
      // Everything else is the same file for everybody
      const withoutWeights = (text: string) => text.replace(/^VISITOR_MOMS_WEIGHT_(KG|LBS)=.*$/gm, '');
      expect(withoutWeights(a1)).toBe(withoutWeights(b));
    });

    it('keeps the .env, which is different for every visitor, out of shared caches, and lets no browser answer a visit from its own cache', async () => {
      const response = await honeypot.proxy(new NextRequest('https://front.test/.env'));
      expect(response?.headers.get('cache-control')).toBe('private, max-age=0');
    });

    it('gives the same secrets to everybody who asks until the server restarts', async () => {
      const first = await (await honeypot.proxy(new NextRequest('https://front.test/.env')))?.text();
      const second = await (await honeypot.proxy(new NextRequest('https://front.test/.env')))?.text();
      expect(first).toBe(second);
    });

    it.each(['lostpassword', 'lostyourpassword', 'retrievepassword'])(
      'switches wp-login.php?action=%s to a forgot password page that only says the reset link is on its way',
      async (action) => {
        const response = await honeypot.proxy(new NextRequest(`https://front.test/wp-login.php?action=${action}`));
        expect(response?.status).toBe(200);
        const html = (await response?.text()) ?? '';
        expect(html).toContain('name="lostpasswordform"');
        expect(html).toContain('name="user_login"');
        expect(html).not.toContain('name="pwd"');
        expect(html).toContain('Check your email for the confirmation link, then visit the login page.');
        // It works like the login form: the script stops the post, and it is the one script the page's CSP allows
        const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1] ?? '';
        expect(script).toContain("addEventListener('submit'");
        expect(script).toContain('e.preventDefault()');
        const hash = createHash('sha256').update(script).digest('base64');
        expect(response?.headers.get('content-security-policy')).toContain(`script-src 'sha256-${hash}'`);
        expect(response?.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=2592000');
      }
    );

    it('leaves wp-login.php with another or no action as the login form, and links the login form to the forgot password page', async () => {
      for (const url of [
        'https://front.test/wp-login.php',
        'https://front.test/wp-login.php?action=register',
        'https://front.test/wp-login.php?action=',
      ]) {
        const html = (await (await honeypot.proxy(new NextRequest(url)))?.text()) ?? '';
        expect(html).toContain('name="loginform"');
        expect(html).toContain('href="/wp-login.php?action=lostpassword"');
      }
    });

    it.each([
      [
        '/wp-login.php',
        [
          'name="log"',
          'name="pwd"',
          'name="rememberme"',
          'name="wp-submit"',
          'name="redirect_to"',
          'name="testcookie"',
          'action="/wp-login.php"',
          'id="loginform"',
        ],
      ],
      [
        '/adminer',
        [
          'name="auth[driver]"',
          'name="auth[server]"',
          'name="auth[username]"',
          'name="auth[password]"',
          'name="auth[db]"',
          'name="auth[permanent]"',
          'name="token"',
          'Adminer',
        ],
      ],
      [
        '/phpmyadmin/',
        [
          'name="pma_username"',
          'name="pma_password"',
          'name="server"',
          'name="set_session"',
          'name="route"',
          'name="token"',
          'action="/phpmyadmin/index.php?route=/"',
          'phpMyAdmin',
        ],
      ],
    ])('gives %s the form targets and field names of the real thing, and a script that stops the post', async (path, expected) => {
      const response = await honeypot.proxy(new NextRequest(`https://front.test${path}`));
      expect(response?.status).toBe(200);
      const html = (await response?.text()) ?? '';
      expected.forEach((part) => expect(html).toContain(part));
      expect(html).toContain('e.preventDefault()');
    });

    it('keeps the login forms apart: Adminer and phpMyAdmin are not WordPress, and the other way around', async () => {
      const get = async (path: string) => (await (await honeypot.proxy(new NextRequest(`https://front.test${path}`)))?.text()) ?? '';
      const [wordpress, adminer, phpmyadmin] = [await get('/wp-login.php'), await get('/adminer'), await get('/phpmyadmin/index.php')];
      expect(wordpress).not.toMatch(/auth\[|pma_/);
      expect(adminer).not.toMatch(/name="pwd"|pma_/);
      expect(phpmyadmin).not.toMatch(/name="pwd"|auth\[/);
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

describe('honeypot decoys across workers', () => {
  const fetchText = async (hp: ReturnType<typeof createHoneypot>, address = '203.0.113.1') =>
    (await (await hp.proxy(new NextRequest('https://front.test/.env', { headers: { 'x-forwarded-for': address } })))?.text()) ?? '';
  const make = (seed?: string) =>
    createHoneypot({
      traps: [{ glob: '/.env', decoy: 'env' }],
      siteName: 'Test Site',
      seed,
      apiHost: 'https://luna.test',
      appHost: 'https://front.test',
    });

  it('make the very same files in every worker given the same seed (the pm2 workers each build their own honeypot)', async () => {
    const [first, second] = [await fetchText(make('build-abc;123')), await fetchText(make('build-abc;123'))];
    expect(first).toBe(second);
    expect(first.length).toBeGreaterThan(5000);
  });

  it('make other files for another seed, a new build', async () => {
    expect(await fetchText(make('build-abc;123'))).not.toBe(await fetchText(make('build-def;456')));
  });

  it('make different files in every worker without a seed (which is why the app passes one)', async () => {
    expect(await fetchText(make())).not.toBe(await fetchText(make()));
  });

  it('keep the visitor line of a seeded honeypot per visitor, in every worker', async () => {
    const [a1, a2, b] = [
      await fetchText(make('s'), '203.0.113.1'),
      await fetchText(make('s'), '203.0.113.1'),
      await fetchText(make('s'), '198.51.100.7'),
    ];
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });
});
