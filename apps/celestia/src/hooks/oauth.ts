import { useQuery } from '@tanstack/react-query';
import { ParsedUrlQuery } from 'querystring';
import { useCallback, useEffect, useState } from 'react';

import { IS_CLIENT_SIDE } from 'src/config';
import { oauthRegistrationFetcher } from 'src/fetchers';
import { useAuth } from 'src/hooks/auth';
import { AccountService } from 'src/services/account';
import { Status, UnifiedErrorResponse } from 'src/types';
import { PostUsersOauthSigninProviderRequest, PostUsersOauthSigninProviderResult, SocialProvider } from 'src/types/auth';
import { ENDPOINTS, mapQueryStatus } from 'src/utils';
import { httpResponseMapper } from 'src/utils/common';
import { takeDiscordLinkIntent } from 'src/utils/oauth-popup';

export function useOAuth(query: ParsedUrlQuery) {
  const { authCheck, user } = useAuth();
  const key = ENDPOINTS.USERS_OAUTH_SIGNIN_PROVIDER({
    provider: query.provider as SocialProvider,
  });
  const fetcher = useCallback(() => oauthRegistrationFetcher(query as unknown as PostUsersOauthSigninProviderRequest)(), [query]);
  const { status, fetchStatus, data, error } = useQuery<PostUsersOauthSigninProviderResult, UnifiedErrorResponse>({
    queryKey: [key],
    queryFn: fetcher,
    enabled: authCheck.status === Status.FAILURE && 'provider' in query && 'code' in query && IS_CLIENT_SIDE,
    retry: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });

  return { status: mapQueryStatus(status, fetchStatus), data, error, user };
}

export type DiscordLinkState = 'checking' | 'none' | 'linking' | 'linked' | 'failed';

/**
 * One attempt per code: the note is taken and the code spent the first time, and the effect below may run again for the same page (strict mode,
 * fast refresh), which must neither find the note gone and conclude this is a sign-in nor send the code twice
 */
const linkAttempts = new Map<string, Promise<'none' | 'linked'>>();

function attemptLink(code: string, userId: number): Promise<'none' | 'linked'> {
  let attempt = linkAttempts.get(code);
  if (!attempt) {
    attempt =
      takeDiscordLinkIntent() === userId
        ? AccountService.linkDiscord(userId, code).then(
            () => 'linked' as const,
            (err: unknown) => Promise.reject(httpResponseMapper(err))
          )
        : Promise.resolve('none' as const);
    linkAttempts.set(code, attempt);
  }
  return attempt;
}

/**
 * The callback page of the Discord popup, when a signed in visitor opened it to link their account (see `noteDiscordLinkIntent`): sends the code to
 * the API once. `none` means this is an ordinary sign-in (or nothing to do), `checking` lasts until the page has looked for the note
 */
export function useDiscordLink(query: ParsedUrlQuery) {
  const { signedIn, user } = useAuth();
  const code = typeof query.code === 'string' ? query.code : null;
  const userId = user.id;
  const relevant = query.provider === 'discord' && code !== null && signedIn && userId !== null;
  const [state, setState] = useState<DiscordLinkState>('checking');
  const [error, setError] = useState<UnifiedErrorResponse | null>(null);

  useEffect(() => {
    if (!relevant || code === null || userId === null) return undefined;
    let current = true;
    const attempt = attemptLink(code, userId);
    // Only a real link shows as one in progress, finding no note is quick
    void Promise.race([attempt, Promise.resolve('pending' as const)]).then((first) => {
      if (current && first === 'pending') setState('linking');
    });
    attempt.then(
      (result) => current && setState(result),
      (err: UnifiedErrorResponse) => {
        if (!current) return;
        setError(err);
        setState('failed');
      }
    );
    return () => {
      current = false;
    };
  }, [relevant, code, userId]);

  return { state: relevant ? state : ('none' as const), error };
}
