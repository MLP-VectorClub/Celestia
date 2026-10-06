import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { API_HOST } from 'src/config';
import { notFound } from 'src/utils/initial-prop-helpers';

/**
 * Hands a cutie mark file of the API (by the ID it has on its own, the way the old site's `/cg/cutiemark/{id}.svg` and `/cg/cutiemark/download/{id}`
 * addresses had it) to the browser, or shows the 404 page when there is no such file. The visitor's cookie goes along for private appearances
 */
export const sendCutieMarkFile = async (
  ctx: GetServerSidePropsContext,
  id: string | undefined,
  disposition: 'image' | 'download'
): Promise<GetServerSidePropsResult<Record<string, never>>> => {
  if (!id || !/^\d+$/.test(id)) return notFound(ctx);

  const headers: Record<string, string> = {};
  if (ctx.req.headers.cookie) headers.cookie = ctx.req.headers.cookie;
  if (ctx.req.headers.authorization) headers.authorization = ctx.req.headers.authorization;
  let response: Response;
  try {
    response = await fetch(`${API_HOST}/cutie-marks/${id}/${disposition}`, { headers });
  } catch {
    ctx.res.writeHead(503).end();
    return { props: {} };
  }
  if (!response.ok) {
    if (response.status === 404 || response.status === 403) return notFound(ctx);
    ctx.res.writeHead(response.status === 429 ? 429 : 502).end();
    return { props: {} };
  }

  ctx.res.setHeader('Content-Type', response.headers.get('content-type') ?? 'image/svg+xml');
  const contentDisposition = response.headers.get('content-disposition');
  if (contentDisposition) ctx.res.setHeader('Content-Disposition', contentDisposition);
  ctx.res.end(Buffer.from(await response.arrayBuffer()));
  return { props: {} };
};
