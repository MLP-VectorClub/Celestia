import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendCutieMarkFile } from 'src/utils/cutiemark-file';

const makeCtx = (headers: Record<string, string> = {}) => {
  const res = { statusCode: 200, headers: {} as Record<string, string>, body: undefined as unknown, ended: false } as {
    statusCode: number;
    headers: Record<string, string>;
    body: unknown;
    ended: boolean;
    setHeader: (k: string, v: string) => void;
    writeHead: (code: number) => typeof res;
    end: (body?: unknown) => void;
  };
  res.setHeader = (k, v) => void (res.headers[k] = v);
  res.writeHead = (code) => {
    res.statusCode = code;
    return res;
  };
  res.end = (body) => {
    res.body = body;
    res.ended = true;
  };
  return { ctx: { req: { headers }, res } as never, res };
};

const respond = (status: number, init: { type?: string; disposition?: string; body?: string } = {}) =>
  // A byte body, a string one would get a text/plain type of its own
  new Response(new TextEncoder().encode(init.body ?? '<svg/>'), {
    status,
    headers: {
      ...(init.type ? { 'content-type': init.type } : {}),
      ...(init.disposition ? { 'content-disposition': init.disposition } : {}),
    },
  });

afterEach(() => vi.unstubAllGlobals());

describe('sendCutieMarkFile', () => {
  it('shows the 404 page for ids that are not numbers', async () => {
    for (const id of [undefined, '', 'abc', '12x', '1.svg']) {
      const { ctx, res } = makeCtx();
      expect(await sendCutieMarkFile(ctx, id, 'image')).toEqual({ notFound: true });
      expect(res.statusCode).toBe(404);
    }
  });

  it('streams the file with its type and file name, passing the visitor along', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respond(200, { type: 'image/svg+xml', disposition: 'attachment; filename="x.svg"', body: '<svg>ok</svg>' }));
    vi.stubGlobal('fetch', fetchMock);
    const { ctx, res } = makeCtx({ cookie: 'a=b', authorization: 'Bearer t' });

    expect(await sendCutieMarkFile(ctx, '42', 'download')).toEqual({ props: {} });

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/cutie-marks\/42\/download$/);
    expect(fetchMock.mock.calls[0][1]).toEqual({ headers: { cookie: 'a=b', authorization: 'Bearer t' } });
    expect(res.headers['Content-Type']).toBe('image/svg+xml');
    expect(res.headers['Content-Disposition']).toBe('attachment; filename="x.svg"');
    expect(Buffer.from(res.body as Buffer).toString()).toBe('<svg>ok</svg>');
  });

  it('defaults to SVG and leaves the disposition off when the API sends none', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(200)));
    const { ctx, res } = makeCtx();
    await sendCutieMarkFile(ctx, '1', 'image');
    expect(res.headers['Content-Type']).toBe('image/svg+xml');
    expect(res.headers['Content-Disposition']).toBeUndefined();
  });

  it.each([
    [404, 404],
    [403, 404],
  ])('shows the 404 page when the API answers %i', async (status, expected) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(status)));
    const { ctx, res } = makeCtx();
    expect(await sendCutieMarkFile(ctx, '1', 'image')).toEqual({ notFound: true });
    expect(res.statusCode).toBe(expected);
  });

  it.each([
    [429, 429],
    [500, 502],
    [503, 502],
  ])('answers %i from the API with %i', async (status, expected) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(status)));
    const { ctx, res } = makeCtx();
    expect(await sendCutieMarkFile(ctx, '1', 'image')).toEqual({ props: {} });
    expect(res.statusCode).toBe(expected);
    expect(res.ended).toBe(true);
  });

  it('answers 503 when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    const { ctx, res } = makeCtx();
    expect(await sendCutieMarkFile(ctx, '1', 'image')).toEqual({ props: {} });
    expect(res.statusCode).toBe(503);
  });
});
