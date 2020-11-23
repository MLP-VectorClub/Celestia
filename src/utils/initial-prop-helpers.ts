import { GetServerSidePropsContext, NextPageContext } from 'next';
import { mapValues, omit, omitBy } from 'lodash';
import { parseRelativeUrl } from 'next/dist/next-server/lib/router/utils/parse-relative-url';
import { buildUrl } from 'src/utils/url';

export const redirect = (ctx: NextPageContext | GetServerSidePropsContext, path: string, status = 301) => {
  const { res } = ctx;
  if (res) {
    res.writeHead(status, { Location: path });
    res.end();
  }
};

export const setResponseStatus = (ctx: Pick<GetServerSidePropsContext, 'res'>, statusCode: number) => {
  const { res } = ctx;
  if (res) {
    res.statusCode = statusCode;
  }
};

export const notFound = (ctx: Pick<GetServerSidePropsContext, 'res'>) => setResponseStatus(ctx, 404);

/**
 * @returns true if caller should halt execution
 */
export const fixPath = (
  ctx: Pick<GetServerSidePropsContext, 'req' | 'res'>,
  expectedPath: string,
  stripParams: string[] = [],
): boolean => {
  const { req, res } = ctx;
  if (!req.url || req.url?.includes('_next')) return false;

  const requestUrlParts = parseRelativeUrl(req.url);
  const strippedParams = mapValues(omitBy(
    omit(
      { ...requestUrlParts.query },
      ['page', ...stripParams],
    ),
    el => typeof el === 'undefined',
  ), String);
  const requestUrl = buildUrl(requestUrlParts.pathname, strippedParams) + requestUrlParts.hash;

  if (requestUrl === expectedPath) return false;

  res.setHeader('location', expectedPath);
  res.setHeader('x-original-location', req.url);
  res.statusCode = 302;
  res.end();
  return true;
};
