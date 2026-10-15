import { useQueryClient } from '@tanstack/react-query';
import { MouseEventHandler, useCallback, useEffect, useRef } from 'react';
import { fromEvent } from 'rxjs';

import { API_PREFIX } from 'src/config';
import { SocialProvider } from 'src/types/auth';
import { ENDPOINTS, popupOpenCenter } from 'src/utils';
import { listenForOAuthResult } from 'src/utils/oauth-popup';

/**
 * Signing in through a provider's page in a popup. The popup reports back over a BroadcastChannel (its `closed` state can't be trusted, see
 * oauth-popup.ts) and the visitor is refetched, which closes the sign-in dialog. Signing in with DeviantArt for the first time makes the account:
 * that is the only way to sign up
 */
export function useSocialSignIn() {
  const queryClient = useQueryClient();
  const popup = useRef<Window | null>(null);

  useEffect(() => {
    const subscription = fromEvent(window, 'beforeunload').subscribe(() => popup.current?.close());
    return () => subscription.unsubscribe();
  }, []);

  return useCallback(
    (provider: SocialProvider, popupTitle: string): MouseEventHandler =>
      (e) => {
        e.preventDefault();

        popup.current = popupOpenCenter(
          API_PREFIX + ENDPOINTS.USERS_OAUTH_SIGNIN_PROVIDER({ provider }),
          popupTitle,
          screen.availWidth * 0.75,
          screen.availHeight * 0.75
        );

        listenForOAuthResult(() => void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.USERS_ME] }));
      },
    [queryClient]
  );
}
