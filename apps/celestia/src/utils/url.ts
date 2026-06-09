import { each, trim } from 'lodash';
import { Numeric } from 'src/types';
import { FavMe } from '@mlp-vectorclub/api-types';

export const makeUrlSafe = (input: string): string => trim(input.replace(/[^A-Za-z\d-]/g, '-').replace(/-+/g, '-'), '-');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParamMap = Record<string, any>;

const queryWithArrays = <T extends ParamMap>(queryParams?: T): string => {
  if (!queryParams) return '';
  const params = new URLSearchParams();
  each(queryParams, (value, key) => {
    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
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

export const createFavMeUrl = (favMe: FavMe) => `http://fav.me/${favMe}`;
