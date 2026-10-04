import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FC, useMemo, useState } from 'react';
import { Alert, Button } from 'reactstrap';

import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import { useRateLimitLock } from 'src/hooks/rate-limit';
import { UnifiedErrorResponseTypes } from 'src/types';
import { FetchFailure } from 'src/utils/fetch-failure';

/**
 * Shown instead of a page whose data could not be fetched on the server (the response has the matching status). Rate limits get the same kind of
 * message as the sign-in form, with the try again button locked until the wait is over
 */
export const FetchFailureView: FC<{ failure: FetchFailure }> = ({ failure }) => {
  const t = useTranslations();
  const { replace, asPath } = useRouter();
  const [retrying, setRetrying] = useState(false);
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
  const kind = rateLimited ? 'rateLimited' : forbidden ? 'forbidden' : failure.status === 503 ? 'unavailable' : 'serverError';
  return (
    <Content>
      <StandardHeading heading={t(`common.error.${kind}.heading`)} lead={t('common.error.withStatus', { statusCode: failure.status })} />
      <Alert color={rateLimited ? 'warning' : 'danger'} fade={false} className="text-center" role="alert">
        {rateLimited
          ? failure.retryAfter
            ? t('common.error.rateLimited.retryIn', { count: failure.retryAfter })
            : t('common.error.rateLimited.retryLater')
          : t(`common.error.${kind}.message`)}
      </Alert>
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
