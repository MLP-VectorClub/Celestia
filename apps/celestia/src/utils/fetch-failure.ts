import { AxiosError } from 'axios';
import { ServerResponse } from 'http';

import { UnifiedErrorResponseTypes } from 'src/types';

/** A server-side data fetch that failed in a way that is not about this page (rate limited, API down), so the page can't be shown */
export interface FetchFailure {
  status: number;
  /** Seconds to wait, when the API said so */
  retryAfter: number | null;
}

/** Statuses that make the whole page unusable: 429 and everything the server answers with 5xx. Missing data (404) and denied access (4xx) are the page's business */
export const isPageFailure = (status: number): boolean => status === 429 || status >= 500;

/**
 * The HTTP status and wait time of a failed request, as an Axios error or as one of the app's mapped errors. No answer at all (the API is
 * unreachable) counts as 503, anything else that went wrong while fetching as 500
 */
export function describeFailure(e: unknown): { status: number; retryAfter: number | null } {
  const toSeconds = (value: unknown) => {
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  };

  if (typeof e === 'object' && e !== null) {
    const response = (e as AxiosError).response;
    if (response?.status) return { status: response.status, retryAfter: toSeconds(response.headers?.['retry-after']) };

    const mapped = e as { type?: string; httpStatus?: number; retryAfter?: unknown };
    if (mapped.type === UnifiedErrorResponseTypes.RATE_LIMITED) return { status: 429, retryAfter: toSeconds(mapped.retryAfter) };
    if (mapped.type === UnifiedErrorResponseTypes.BACKEND_DOWN) return { status: 503, retryAfter: null };
    if (mapped.httpStatus) return { status: mapped.httpStatus, retryAfter: null };
    if ((e as AxiosError).isAxiosError) return { status: 503, retryAfter: null };
  }
  return { status: 500, retryAfter: null };
}

const failures = new WeakMap<ServerResponse, FetchFailure>();

export const recordFetchFailure = (res: ServerResponse, failure: FetchFailure): void => {
  // The first one decides, a rate limited page tends to fail on every other request too
  if (!failures.has(res)) failures.set(res, failure);
};

export const takeFetchFailure = (res: ServerResponse): FetchFailure | undefined => {
  const failure = failures.get(res);
  failures.delete(res);
  return failure;
};
