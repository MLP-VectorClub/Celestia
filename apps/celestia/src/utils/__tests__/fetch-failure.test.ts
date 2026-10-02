import { AxiosError } from 'axios';
import { ServerResponse } from 'http';
import { describe, expect, it } from 'vitest';

import { UnifiedErrorResponseTypes } from 'src/types';
import { httpResponseMapper } from 'src/utils/common';
import { describeFailure, isPageFailure, recordFetchFailure, takeFetchFailure } from 'src/utils/fetch-failure';

const axiosError = (status: number, headers: Record<string, string> = {}) =>
  Object.assign(new AxiosError('x'), { response: { status, data: {}, headers } });

describe('isPageFailure', () => {
  it('is for rate limits and server errors only', () => {
    expect([200, 301, 401, 403, 404, 409, 422].map(isPageFailure)).toEqual(Array(7).fill(false));
    expect([429, 500, 502, 503, 504].map(isPageFailure)).toEqual(Array(5).fill(true));
  });
});

describe('describeFailure', () => {
  it('reads the status and the wait time of an Axios error', () => {
    expect(describeFailure(axiosError(429, { 'retry-after': '39' }))).toEqual({ status: 429, retryAfter: 39 });
    expect(describeFailure(axiosError(500))).toEqual({ status: 500, retryAfter: null });
    expect(describeFailure(axiosError(404))).toEqual({ status: 404, retryAfter: null });
  });

  it('ignores a wait time that is not a positive number', () => {
    expect(describeFailure(axiosError(429, { 'retry-after': 'soon' }))).toEqual({ status: 429, retryAfter: null });
    expect(describeFailure(axiosError(429, { 'retry-after': '0' }))).toEqual({ status: 429, retryAfter: null });
  });

  it('understands the errors the fetchers return after mapping', () => {
    expect(describeFailure(httpResponseMapper(axiosError(429, { 'retry-after': '12' })))).toEqual({ status: 429, retryAfter: 12 });
    expect(describeFailure(httpResponseMapper(axiosError(503)))).toEqual({ status: 503, retryAfter: null });
    expect(describeFailure(httpResponseMapper(axiosError(502)))).toEqual({ status: 502, retryAfter: null });
    expect(describeFailure(httpResponseMapper(axiosError(404)))).toEqual({ status: 404, retryAfter: null });
    expect(describeFailure({ type: UnifiedErrorResponseTypes.RATE_LIMITED, retryAfter: 5 })).toEqual({ status: 429, retryAfter: 5 });
  });

  it('counts an unreachable API as 503 and any other failure as 500', () => {
    expect(describeFailure(Object.assign(new AxiosError('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }))).toEqual({
      status: 503,
      retryAfter: null,
    });
    expect(describeFailure(new TypeError('x is not a function'))).toEqual({ status: 500, retryAfter: null });
    expect(describeFailure(undefined)).toEqual({ status: 500, retryAfter: null });
  });
});

describe('recording a failure per response', () => {
  it('hands it over once, and the first failure of a response wins', () => {
    const res = {} as ServerResponse;
    expect(takeFetchFailure(res)).toBeUndefined();
    recordFetchFailure(res, { status: 429, retryAfter: 30 });
    recordFetchFailure(res, { status: 500, retryAfter: null });
    expect(takeFetchFailure(res)).toEqual({ status: 429, retryAfter: 30 });
    expect(takeFetchFailure(res)).toBeUndefined();
  });

  it('keeps the failures of different responses apart', () => {
    const a = {} as ServerResponse;
    const b = {} as ServerResponse;
    recordFetchFailure(a, { status: 503, retryAfter: null });
    expect(takeFetchFailure(b)).toBeUndefined();
    expect(takeFetchFailure(a)).toEqual({ status: 503, retryAfter: null });
  });
});
