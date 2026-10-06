import { each, trim } from 'lodash';

import { Numeric } from 'src/types';
import { FavMe } from 'src/types/api-alias';

export const makeUrlSafe = (input: string): string => trim(input.replace(/[^A-Za-z\d-]/g, '-').replace(/-+/g, '-'), '-');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParamMap = Record<string, any>;

const queryWithArrays = <T extends ParamMap>(queryParams?: T): string => {
  if (!queryParams) return '';
  const params = new URLSearchParams();
  each(queryParams, (value, key) => {
    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value as any[]).forEach((el) => params.append(`${key}[]`, String(el)));
    } else if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

export const buildUrl = <T extends ParamMap>(path: string, queryParams?: T) => {
  const queryString = queryParams ? queryWithArrays(queryParams) : false;
  return path + (queryString ? `?${queryString}` : '');
};

export const pathSegmentWithId = (id: Numeric, str: string) => {
  const urlSafeString = makeUrlSafe(str);
  return urlSafeString.length === 0 ? `${id}` : `${id}-${urlSafeString}`;
};

/** Where a page with the name in its address should send visitors that came without it or with an old name, with the query string kept; `null` when the address is canonical */
export const canonicalPathRedirect = (resolvedUrl: string, canonicalPath: string): string | null => {
  const queryStart = resolvedUrl.indexOf('?');
  const path = queryStart === -1 ? resolvedUrl : resolvedUrl.slice(0, queryStart);
  if (path === canonicalPath) return null;
  return canonicalPath + (queryStart === -1 ? '' : resolvedUrl.slice(queryStart));
};

export const createFavMeUrl = (favMe: FavMe) => `http://fav.me/${favMe}`;
