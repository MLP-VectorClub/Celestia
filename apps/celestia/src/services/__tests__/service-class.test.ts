import Axios from 'axios';
import { IncomingMessage } from 'http';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { APP_HOST } from 'src/config';
import { ResourceService } from 'src/services/resource';
import { visitorAddress } from 'src/services/service-class';

const request = (headers: Record<string, string | string[]>) => ({ headers }) as unknown as IncomingMessage;

describe('visitorAddress', () => {
  it('prefers X-Real-IP and falls back to the first address of X-Forwarded-For', () => {
    expect(visitorAddress({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' })).toBe('203.0.113.7');
    expect(visitorAddress({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' })).toBe('198.51.100.1');
    expect(visitorAddress({ 'x-forwarded-for': ['2001:db8::1', '10.0.0.1'] })).toBe('2001:db8::1');
  });

  it('has none without those headers', () => {
    expect(visitorAddress({})).toBeUndefined();
    expect(visitorAddress(undefined)).toBeUndefined();
    expect(visitorAddress({ 'x-real-ip': '  ' })).toBeUndefined();
  });
});

describe('requests made for a visitor', () => {
  afterEach(() => vi.restoreAllMocks());

  const headersOf = async (incoming: Record<string, string>) => {
    const get = vi.spyOn(Axios, 'get').mockResolvedValue({ data: {} });
    await new ResourceService(request(incoming)).get('/show');
    return get.mock.calls[0][1]?.headers;
  };

  it('pass on the visitor, the cookie and the authorization', async () => {
    const headers = await headersOf({ 'x-real-ip': '203.0.113.7', cookie: 'a=b', authorization: 'Bearer t', accept: 'text/html' });
    expect(headers).toMatchObject({ 'x-forwarded-for': '203.0.113.7', cookie: 'a=b', authorization: 'Bearer t' });
    expect(headers).not.toHaveProperty('accept');
  });

  it('send no address when the request has none', async () => {
    expect(await headersOf({ cookie: 'a=b' })).not.toHaveProperty('x-forwarded-for');
  });

  it('always come from the front end, so the API accepts the visitor session cookie, whatever site the visitor came from', async () => {
    expect(await headersOf({ cookie: 'a=b' })).toMatchObject({ referer: APP_HOST });
    expect(await headersOf({ cookie: 'a=b', referer: 'https://www.google.com/', origin: 'https://evil.example' })).toMatchObject({
      referer: APP_HOST,
    });
    expect(await headersOf({ cookie: 'a=b', origin: 'https://evil.example' })).not.toHaveProperty('origin');
  });
});
