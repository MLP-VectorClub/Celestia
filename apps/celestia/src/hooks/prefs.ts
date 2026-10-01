import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { prefsFetcher } from 'src/fetchers';
import { UserPrefs } from 'src/types/api-alias';
import { ENDPOINTS } from 'src/utils';

export function usePrefs(enabled: boolean): Partial<UserPrefs> | undefined {
  const fetcher = useCallback(() => prefsFetcher()(), []);
  const { data } = useQuery({
    queryKey: [ENDPOINTS.USER_PREFS_ME()],
    queryFn: fetcher,
    enabled,
    refetchOnWindowFocus: 'always',
  });

  return enabled ? data : undefined;
}
