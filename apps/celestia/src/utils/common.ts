import { AxiosError } from 'axios';
import { range as _range, get, isPlainObject, omit } from 'lodash';
import { GetServerSidePropsContext } from 'next';

import { APP_HOST } from 'src/config';
import { UnifiedErrorResponse, UnifiedErrorResponseTypes, isValidationErrorResponse } from 'src/types';
import { setResponseStatus } from 'src/utils/initial-prop-helpers';

export const sanitizePageParam = (value: string): number => {
  const page = parseInt(value, 10);
  if (isNaN(page) || page < 1) return 1;
  return page;
};
export const sanitizePageSizeParam =
  (values: number[]) =>
  (value: string): number => {
    const size = parseInt(value, 10);
    if (!values.includes(size)) return values[0];
    return size;
  };
export const sanitizeSearchParam = (value?: string): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

/**
 * Clear way to make sure the first page does not show as a query param in the URL
 */
export const paginationParam = (page: number): number | undefined => (page === 1 ? undefined : page);

export const range = (start: number, end: number, step = 1): number[] => _range(start, end + step, step);

export const httpResponseMapper = (err: AxiosError | unknown): UnifiedErrorResponse => {
  const statusCode = typeof err === 'object' && err !== null && 'isAxiosError' in err ? (err as AxiosError).response?.status : 0;
  switch (statusCode) {
    case 503: {
      const message = get(err, 'response.data.message') as unknown;
      return {
        type: UnifiedErrorResponseTypes.BACKEND_DOWN,
        message: typeof message === 'string' ? message : null,
      };
    }
    case 419:
      return { type: UnifiedErrorResponseTypes.MISSING_CSRF_TOKEN };
    case 401:
      return { type: UnifiedErrorResponseTypes.AUTHENTICATION_ERROR };
    case 422: {
      const body = isValidationErrorResponse(err)
        ? err.response.data
        : {
            message: 'Could not find errors in response',
            errors: {},
          };
      return {
        type: UnifiedErrorResponseTypes.VALIDATION_ERROR,
        ...body,
      };
    }
    case 429: {
      const retryAfter = Number(get(err, 'response.headers.retry-after', NaN));
      return {
        type: UnifiedErrorResponseTypes.RATE_LIMITED,
        retryAfter,
      };
    }
    default: {
      const body = get(err, 'response.data') as unknown;
      const message = get(err, 'response.data.message') as unknown;
      if (typeof message === 'string') {
        return {
          type: UnifiedErrorResponseTypes.MESSAGE_ONLY,
          message,
          details: omit(isPlainObject(body) ? (body as Record<string, unknown>) : {}, 'message'),
        };
      }
      return {
        type: UnifiedErrorResponseTypes.UNKNOWN,
        payload: JSON.stringify(err, null, 2),
      };
    }
  }
};

// Always the configured host, never the browser's location: these URLs are canonical/share links,
// and rendering something different in the browser than on the server breaks hydration
export const assembleSeoUrl = (pathname?: string): string => `${APP_HOST}${pathname || ''}`;

export const handleDataFetchingError = (ctx: GetServerSidePropsContext, e: unknown): void => {
  if (e instanceof Error && 'response' in e) {
    const { response } = e as AxiosError;
    const status = response?.status;
    if (status) {
      setResponseStatus(ctx, status);
    }
    if (status !== 404) {
      console.error(response);
    }
  } else {
    console.error(e);
  }
};
