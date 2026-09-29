import { QueryClient, keepPreviousData } from '@tanstack/react-query';

import { IS_CLIENT_SIDE } from 'src/config';

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60e3,
        placeholderData: keepPreviousData,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

/**
 * On the server every request gets its own client: a shared one would keep one visitor's data
 * cached for everyone else, and since initialData only applies to an empty cache, pages would keep
 * rendering whatever the first request fetched. In the browser one client lasts the whole session.
 */
export const getQueryClient = (): QueryClient => {
  if (!IS_CLIENT_SIDE) return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
};
