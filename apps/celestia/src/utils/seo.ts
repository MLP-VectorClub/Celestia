import { assembleSeoUrl } from 'src/utils/common';

/** The only query parameters that make a different page (the rest is tracking and search state) */
const CANONICAL_PARAMS = ['page'];

/**
 * The address search engines should list for a page: no `#fragment`, and only the `page` of a list (without it, the
 * first page, which already is the address without a query)
 */
export const canonicalPagePath = (asPath: string): string => {
  const [pathAndQuery] = asPath.split('#');
  const [path, query = ''] = pathAndQuery.split('?');
  const params = new URLSearchParams(query);
  const kept = new URLSearchParams();
  CANONICAL_PARAMS.forEach((name) => {
    const value = params.get(name);
    if (value && !(name === 'page' && value === '1')) kept.set(name, value);
  });
  const search = kept.toString();
  return `${path}${search ? `?${search}` : ''}`;
};

/** `canonicalPagePath` with the configured host in front */
export const canonicalPageUrl = (asPath: string): string => assembleSeoUrl(canonicalPagePath(asPath));
