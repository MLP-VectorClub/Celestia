import { QueryClient } from '@tanstack/react-query';

export interface WithAppThunkExtra {
  extra: {
    queryCache: QueryClient;
  };
}
