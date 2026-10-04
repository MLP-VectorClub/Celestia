import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Alert, Button } from 'reactstrap';

import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { describeApiError, useApiMutation, useAuth, useTitleSetter } from 'src/hooks';
import { AccountService } from 'src/services/account';
import { useAppDispatch, wrapper } from 'src/store';
import { authActions } from 'src/store/slices';
import { AuthModalSide, SSRMessages, Translatable } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

const titleFactory: TitleFactory = () => {
  const title: Translatable = ['users.verify.title'];
  return { title, breadcrumbs: [{ label: title, active: true }] };
};

/** The mail's link has `hash` (exactly 128 characters) and `action` (`verify` or `block`) */
const parseLink = (query: Record<string, string | string[] | undefined>) => {
  const { hash, action } = query;
  if (typeof hash !== 'string' || !/^[0-9a-f]{128}$/i.test(hash)) return null;
  if (action !== 'verify' && action !== 'block') return null;
  return { hash, action } as const;
};

const VerifyEmailPage: NextPage = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { query } = useRouter();
  const { signedIn, isStaff } = useAuth();
  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);

  const link = parseLink(query);
  const send = useApiMutation(() => AccountService.verifyEmail(link!.hash, link!.action));

  return (
    <Content>
      <StandardHeading
        heading={t((link?.action ?? query.action) === 'block' ? 'users.verify.blockHeading' : 'users.verify.verifyHeading')}
        lead={t('users.verify.lead')}
      />
      {!link && (
        <Alert color="danger" fade={false}>
          {t('users.verify.invalid')}
        </Alert>
      )}
      {link && !(signedIn && isStaff) && (
        <div className="text-center">
          <p>{t('users.verify.signInRequired')}</p>
          <Button color="primary" onClick={() => dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN))}>
            {t('users.verify.signIn')}
          </Button>
        </div>
      )}
      {link && signedIn && isStaff && !send.isSuccess && (
        <div className="text-center">
          <p>{link.action === 'verify' ? t('users.verify.verifyPrompt') : t('users.verify.blockPrompt')}</p>
          <Button color={link.action === 'verify' ? 'primary' : 'danger'} disabled={send.isPending} onClick={() => send.mutate()}>
            {link.action === 'verify' ? t('users.verify.verify') : t('users.verify.block')}
          </Button>
          {send.error && (
            <Alert color="danger" fade={false} role="alert" className="mt-3">
              {describeApiError(send.error)}
            </Alert>
          )}
        </div>
      )}
      {send.isSuccess && (
        <Alert color="success" fade={false} role="status">
          {send.data?.message ?? t('users.verify.done')}
        </Alert>
      )}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<SSRMessages>((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return { props: { ...(await typedServerSideTranslations(locale, ['users'])) } };
});

export default VerifyEmailPage;
