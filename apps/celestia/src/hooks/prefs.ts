import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { prefsFetcher } from 'src/fetchers';
import { UserPrefs } from 'src/types/api-alias';
import { AccountService } from 'src/services/account';
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

export const userPrefsKey = (userId: number) => `/users/${userId}/preferences`;

/** All preferences of a user: the visitor's own, or anyone's for staff (what the profile page's preference forms edit) */
export function useUserPrefs(userId: number, enabled: boolean): Partial<UserPrefs> | undefined {
  const { data } = useQuery({
    queryKey: [userPrefsKey(userId)],
    queryFn: () => AccountService.getPreferences(userId).then((r) => r.data),
    enabled,
  });
  return enabled ? data : undefined;
}
