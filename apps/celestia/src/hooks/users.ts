import { useQuery } from '@tanstack/react-query';

import { GetAboutMembersResult } from '@mlp-vectorclub/api-types';
import { membersFetcher, usersFetcher } from 'src/fetchers';
import { ENDPOINTS, mapQueryStatus } from 'src/utils';

export function useMembers(initialData?: GetAboutMembersResult) {
  const {
    data: members,
    status,
    fetchStatus,
  } = useQuery({
    queryKey: [ENDPOINTS.MEMBERS],
    queryFn: membersFetcher,
    initialData,
  });

  return { members, status: mapQueryStatus(status, fetchStatus) };
}

export function useUsers(enabled: boolean) {
  const {
    data: users,
    error,
    status,
    fetchStatus,
  } = useQuery({
    queryKey: [ENDPOINTS.USERS],
    queryFn: usersFetcher,
    enabled,
    placeholderData: undefined,
  });

  return { users, error, status: mapQueryStatus(status, fetchStatus) };
}
