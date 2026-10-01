import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';

import { UnifiedErrorResponse, UnifiedErrorResponseTypes } from 'src/types';
import { httpResponseMapper } from 'src/utils/common';

/**
 * A readable message for the user from whatever the API (or the network) answered with. `422` carries one message per field,
 * the first is the one shown (the API stops at the first failure).
 */
export const describeApiError = (error: UnifiedErrorResponse): string => {
  switch (error.type) {
    case UnifiedErrorResponseTypes.AUTHENTICATION_ERROR:
      return 'You need to sign in to do that.';
    case UnifiedErrorResponseTypes.MISSING_CSRF_TOKEN:
      return 'Your session expired, please reload the page and try again.';
    case UnifiedErrorResponseTypes.RATE_LIMITED:
      return Number.isFinite(error.retryAfter)
        ? `Too many attempts, try again in ${error.retryAfter} seconds.`
        : 'Too many attempts, try again later.';
    case UnifiedErrorResponseTypes.BACKEND_DOWN:
      return error.message || 'The server is not available at the moment, please try again later.';
    case UnifiedErrorResponseTypes.VALIDATION_ERROR: {
      const first = Object.values(error.errors ?? {})[0]?.[0];
      return first || error.message || 'Some of the data you provided is invalid.';
    }
    case UnifiedErrorResponseTypes.MESSAGE_ONLY:
      return error.message;
    default:
      return 'Something went wrong, please try again later.';
  }
};

/** Field name → message of a validation error, empty for anything else */
export const fieldErrors = (error: UnifiedErrorResponse | null | undefined): Record<string, string> => {
  if (!error || error.type !== UnifiedErrorResponseTypes.VALIDATION_ERROR) return {};
  return Object.fromEntries(Object.entries(error.errors ?? {}).map(([field, messages]) => [field, messages[0]]));
};

interface Options<TData, TVars> {
  /** Query keys (or key prefixes) to refetch once the request succeeded; reads are never patched from write responses */
  invalidate?: QueryKey[] | ((variables: TVars, data: TData) => QueryKey[]);
  onSuccess?: (data: TData, variables: TVars) => void;
}

/**
 * Wraps a request into a mutation whose error is a `UnifiedErrorResponse`, and refetches the listed queries on success
 */
export function useApiMutation<TData, TVars = void>(
  request: (variables: TVars) => Promise<AxiosResponse<TData>>,
  options: Options<TData, TVars> = {}
) {
  const queryClient = useQueryClient();
  return useMutation<TData, UnifiedErrorResponse, TVars>({
    mutationFn: (variables) =>
      request(variables)
        .then((response) => response.data)
        .catch((err: unknown) => Promise.reject(httpResponseMapper(err))),
    onSuccess: async (data, variables) => {
      const keys = typeof options.invalidate === 'function' ? options.invalidate(variables, data) : (options.invalidate ?? []);
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      options.onSuccess?.(data, variables);
    },
  });
}
