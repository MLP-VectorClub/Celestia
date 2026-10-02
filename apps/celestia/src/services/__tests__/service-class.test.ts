import Axios from 'axios';
import { IncomingMessage } from 'http';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

  it('pass on the visitor, the cookie and the authorization', async () => {
    const get = vi.spyOn(Axios, 'get').mockResolvedValue({ data: {} });
    await new ResourceService(request({ 'x-real-ip': '203.0.113.7', cookie: 'a=b', authorization: 'Bearer t', accept: 'text/html' })).get(
      '/show'
    );

    const headers = get.mock.calls[0][1]?.headers;
    expect(headers).toMatchObject({ 'x-forwarded-for': '203.0.113.7', cookie: 'a=b', authorization: 'Bearer t' });
    expect(headers).not.toHaveProperty('accept');
  });

  it('send no address when the request has none', async () => {
    const get = vi.spyOn(Axios, 'get').mockResolvedValue({ data: {} });
    await new ResourceService(request({ cookie: 'a=b' })).get('/show');
    expect(get.mock.calls[0][1]?.headers).not.toHaveProperty('x-forwarded-for');
  });
});
