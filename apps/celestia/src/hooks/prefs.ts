import { ENDPOINTS } from 'src/utils';
import { useQuery } from '@tanstack/react-query';
import { prefsFetcher } from 'src/fetchers';
import { UserPrefs } from '@mlp-vectorclub/api-types';
import { useCallback } from 'react';

export function usePrefs(enabled: boolean): UserPrefs | undefined {
  const fetcher = useCallback(() => prefsFetcher()(), []);
  const { data } = useQuery({
    queryKey: [ENDPOINTS.USER_PREFS_ME()],
    queryFn: fetcher,
    enabled,
    refetchOnWindowFocus: 'always',
  });

  return enabled ? data : undefined;
}
