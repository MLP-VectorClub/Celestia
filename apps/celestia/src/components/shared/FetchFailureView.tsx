import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button } from 'reactstrap';

import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import { useAuth, useTitleSetter } from 'src/hooks';
import { useRateLimitLock } from 'src/hooks/rate-limit';
import { useAppDispatch } from 'src/store';
import { authActions } from 'src/store/slices';
import { AuthModalSide, UnifiedErrorResponseTypes } from 'src/types';
import { FetchFailure } from 'src/utils/fetch-failure';

/**
 * Shown instead of a page whose data could not be fetched on the server (the response has the matching status). Rate limits get the same kind of
 * message as the sign-in form, with the try again button locked until the wait is over
 */
export const FetchFailureView: FC<{ failure: FetchFailure }> = ({ failure }) => {
  const t = useTranslations();
  const { replace, asPath } = useRouter();
  const [retrying, setRetrying] = useState(false);
  const dispatch = useAppDispatch();
  // The status is in the title, like the old site's "403 - MLP Vector Club"
  const title = String(failure.status);
  useTitleSetter(
    dispatch,
    useMemo(() => ({ title, breadcrumbs: [{ label: 'Error' }, { label: title, active: true }] }), [title])
  );
  const rateLimited = failure.status === 429;
  const locked = useRateLimitLock(
    useMemo(
      () => (rateLimited && failure.retryAfter ? { type: UnifiedErrorResponseTypes.RATE_LIMITED, retryAfter: failure.retryAfter } : null),
      [failure.retryAfter, rateLimited]
    )
  );

  const retry = () => {
    setRetrying(true);
    // Runs the page's data fetching again, a page without the failure replaces this one
    void replace(asPath).finally(() => setRetrying(false));
  };

  const forbidden = failure.status === 403;
  // A 403 for somebody who is not signed in is mostly "sign in first": ask them to, and once they have, run the page's data fetching again (the page was
  // refused on the server for a visitor it did not know, it would stay refused otherwise)
  const { signedIn } = useAuth();
  const askToSignIn = forbidden && !signedIn;
  const wasSignedIn = useRef(signedIn);
  useEffect(() => {
    if (askToSignIn) dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN));
    // Only the moment of asking: not again every time the dialog is closed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (signedIn && !wasSignedIn.current && forbidden) void replace(asPath);
    wasSignedIn.current = signedIn;
  }, [asPath, forbidden, replace, signedIn]);
  const kind = rateLimited ? 'rateLimited' : forbidden ? 'forbidden' : failure.status === 503 ? 'unavailable' : 'serverError';
  return (
    <Content>
      <StandardHeading heading={t(`common.error.${kind}.heading`)} />
      <Alert color={rateLimited ? 'warning' : 'danger'} fade={false} className="text-center" role="alert">
        {rateLimited
          ? failure.retryAfter
            ? t('common.error.rateLimited.retryIn', { count: failure.retryAfter })
            : t('common.error.rateLimited.retryLater')
          : t(`common.error.${kind}.message`)}
      </Alert>
      {askToSignIn && (
        <p className="text-center">
          <Button color="primary" onClick={() => dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN))}>
            <InlineIcon icon="sign-in-alt" first />
            {t('common.error.forbidden.signIn')}
          </Button>
        </p>
      )}
      {!forbidden && (
        <p className="text-center">
          <Button color="ui" onClick={retry} disabled={locked || retrying}>
            <InlineIcon icon="sync" first loading={retrying} />
            {t('common.error.tryAgain')}
          </Button>
        </p>
      )}
    </Content>
  );
};
