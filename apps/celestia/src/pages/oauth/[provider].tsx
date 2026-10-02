import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQueryClient } from '@tanstack/react-query';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button } from 'reactstrap';

import { User } from '@mlp-vectorclub/api-types';
import Center from 'src/components/shared/Center';
import InlineIcon from 'src/components/shared/InlineIcon';
import LoadingRing from 'src/components/shared/LoadingRing';
import StandardHeading from 'src/components/shared/StandardHeading';
import { useLayout, useOAuth, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { OAuthErrorTypes, SSRMessages, Status, Translatable, UnifiedErrorResponseTypes } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { ENDPOINTS, setResponseStatus } from 'src/utils';
import { getOAuthProvider } from 'src/utils/auth';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { reportOAuthSuccess } from 'src/utils/oauth-popup';

const titleFactory: TitleFactory<{ provider?: string }> = (query) => {
  const provider = getOAuthProvider(query.provider);
  const title: Translatable = ['oauth.authTitle', { provider }];
  return {
    title,
    breadcrumbs: [],
  };
};

const OAuthPage: NextPage = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { setLayoutDisabled } = useLayout();
  const { query } = useRouter();
  const [closeHint, setCloseHint] = useState(false);
  const { status, error, user } = useOAuth(query);
  const queryClient = useQueryClient();

  const success = status === Status.SUCCESS;
  const authorized = user.name !== null;
  const provider = getOAuthProvider(query.provider);

  useEffect(() => {
    setLayoutDisabled(true);
    return () => setLayoutDisabled(false);
  }, [setLayoutDisabled]);

  useEffect(() => {
    if (!success) return;

    void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.USERS_ME] });
  }, [queryClient, success]);

  // Tell the page that opened this popup, which closes the popup in return. If that doesn't happen (this isn't a popup, or the browser refuses to
  // close the window) show what to do instead
  useEffect(() => {
    if (!authorized) return;

    const stop = reportOAuthSuccess(() => window.close());
    const hintTimeout = setTimeout(() => setCloseHint(true), 1500);
    return () => {
      stop();
      clearTimeout(hintTimeout);
    };
  }, [authorized]);

  const titleData = useMemo(() => titleFactory(query), [query]);
  useTitleSetter(dispatch, titleData);

  const header = t('oauth.authTitle', { provider });

  if (query.code) {
    if (status === Status.FAILURE) {
      query.error = OAuthErrorTypes.ServerError;
      if (error && error.type === UnifiedErrorResponseTypes.MESSAGE_ONLY) {
        query.error_description = error.message;
      }
    } else {
      const color = authorized ? 'success' : 'primary';
      const message = authorized ? null : `${success ? t('oauth.loadingUserData') : t('oauth.creatingSession')}…`;
      return (
        <Center color={color} header={header} className="text-center">
          {!authorized ? <LoadingRing color={color} style={{ width: '200px' }} /> : <FontAwesomeIcon icon="check-circle" size="10x" />}
          {message && <h3 className="mt-3 mb-0">{message}</h3>}
          {authorized && <h3 className="mt-3 mb-0">{t('oauth.signedIn')}</h3>}
          {authorized && closeHint && (
            <>
              <p className="mt-3 mb-2">{t('oauth.closeHint')}</p>
              <Link href={PATHS.USER_LONG(user as User)}>{t('oauth.continueToProfile')}</Link>
            </>
          )}
        </Center>
      );
    }
  }

  const unknownError = t('oauth.errorTypes.unknown_error');
  const knownErrorTypes: string[] = Object.values(OAuthErrorTypes);
  const heading =
    typeof query.error === 'string' && knownErrorTypes.includes(query.error) ? t(`oauth.errorTypes.${query.error}`) : unknownError;

  return (
    <Center color="danger" header={header} className="text-center">
      <StandardHeading heading={heading} lead={query.error_description || t('oauth.unknownError')} />
      {error?.type === UnifiedErrorResponseTypes.RATE_LIMITED && (
        <Alert color="danger" className="mt-3 mb-0">
          {t('common.auth.rateLimited', { count: error.retryAfter })}
        </Alert>
      )}
      <Button color="danger" onClick={() => window.close()} className="mt-3">
        <InlineIcon first icon="times" />
        {t('oauth.close')}
      </Button>
    </Center>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<SSRMessages>((store) => async (ctx) => {
  const { query, locale } = ctx;
  if (query.error || query.error_description) setResponseStatus(ctx, 500);

  titleSetter(store, titleFactory(query));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['oauth'])),
    },
  };
});

export default OAuthPage;
