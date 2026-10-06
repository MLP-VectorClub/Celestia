import { useQuery } from '@tanstack/react-query';

import { currentUserFetcher } from 'src/fetchers/auth';
import { useCsrf } from 'src/hooks/core';
import { useAppSelector } from 'src/store';
import { FailsafeUser, Status, UnifiedErrorResponse, UnifiedErrorResponseTypes } from 'src/types';
import { ENDPOINTS, mapQueryStatus, permission } from 'src/utils';

const guestUser: FailsafeUser = {
  id: null,
  name: null,
  role: null,
  avatarUrl: null,
  avatarProvider: 'deviantart',
};

interface CurrentUserHookValue {
  signedIn: boolean;
  user: FailsafeUser;
  isStaff: boolean;
  authCheck: {
    status: Status;
  };
  /** The visitor's data is being refreshed in the background (the API may be renewing the DeviantArt session) */
  refreshing: boolean;
  /** The API signed the visitor out because their DeviantArt session could not be renewed */
  sessionEnded: boolean;
}

export function useAuth(): CurrentUserHookValue {
  // The server looked the visitor up while rendering, so the first render (server and browser) already knows who is signed in
  const initialUser = useAppSelector((state) => state.auth.initialUser);
  const csrf = useCsrf();
  const {
    status,
    fetchStatus,
    data: user,
    isError,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: [ENDPOINTS.USERS_ME],
    queryFn: currentUserFetcher,
    enabled: csrf,
    initialData: initialUser ?? undefined,
    retry: (_failureCount, error: UnifiedErrorResponse) => error.type !== UnifiedErrorResponseTypes.AUTHENTICATION_ERROR,
  });

  const signedIn = !isError && Boolean(user);

  return {
    signedIn,
    user: signedIn ? user! : guestUser,
    isStaff: signedIn && permission(user!.role, 'staff'),
    authCheck: {
      status: mapQueryStatus(status, fetchStatus),
    },
    refreshing: signedIn && isFetching,
    sessionEnded:
      isError &&
      (queryError as UnifiedErrorResponse | null)?.type === UnifiedErrorResponseTypes.AUTHENTICATION_ERROR &&
      Boolean((queryError as { deviantArtRequired?: boolean }).deviantArtRequired),
  };
}
