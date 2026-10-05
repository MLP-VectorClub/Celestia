import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Alert, Button } from 'reactstrap';

import { GetUsersIdResult } from '@mlp-vectorclub/api-types';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import { EmailChangeForm } from 'src/components/users/EmailChangeForm';
import { PasswordForm } from 'src/components/users/PasswordForm';
import { DiscordSection } from 'src/components/users/account/DiscordSection';
import { SessionsSection } from 'src/components/users/account/SessionsSection';
import { userFetcher } from 'src/fetchers';
import { useAuth, useTitleSetter, useUserProfile } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { forbidden, handleDataFetchingError, notFound } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { parseUserIdParam } from 'src/utils/profile';

interface PropTypes {
  userId: number;
  user: Nullable<GetUsersIdResult>;
}

const titleFactory: TitleFactory<Pick<PropTypes, 'user'>> = ({ user }) => ({
  title: ['common.titles.account'],
  breadcrumbs: [
    { label: ['users.profile.breadcrumb'] },
    ...(user ? [{ label: user.name, linkProps: { href: PATHS.USER_LONG(user) } }] : []),
    { label: ['users.account.breadcrumb'], active: true },
  ],
});

const AccountPage: NextPage<PropTypes> = ({ userId, user }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { user: authUser, signedIn, isStaff } = useAuth();
  const { profile } = useUserProfile({ id: userId });

  const titleData = useMemo(() => titleFactory({ user }), [user]);
  useTitleSetter(dispatch, titleData);

  const heading = <StandardHeading heading={t('users.account.heading')} lead={t('users.account.lead')} />;

  if (!signedIn) {
    return (
      <Content>
        {heading}
        <Alert color="ui" fade={false}>
          {t('users.account.signInRequired')}
        </Alert>
      </Content>
    );
  }

  if (authUser.id !== userId) {
    return (
      <Content>
        {heading}
        <Alert color="warning" fade={false}>
          {t('users.account.notYours')}
        </Alert>
      </Content>
    );
  }

  return (
    <Content>
      {heading}
      <div id="account">
        <SessionsSection />
        {isStaff && profile && (
          <section id="security">
            <h2>
              <span title={t('users.profile.visibleTo.staff')} className="me-1">
                <InlineIcon icon="lock" size="sm" />
              </span>
              {t('users.account.security')}
            </h2>
            <EmailChangeForm profile={profile} sameUser />
            <PasswordForm passwordSet={Boolean(profile.account?.passwordSet)} />
          </section>
        )}
        {profile && <DiscordSection profile={profile} sameUser />}
        <section>
          <h2>
            <span title={t('users.profile.visibleTo.staff')} className="me-1">
              <InlineIcon icon="lock" size="sm" />
            </span>
            {t('users.account.sections.deviantart')}
          </h2>
          <p>{t('users.account.deviantartText')}</p>
          <Button tag="a" color="guide-link" href="https://www.deviantart.com/account/auth" target="_blank" rel="noopener noreferrer">
            <InlineIcon icon="arrow-right" first />
            {t('users.account.deviantartButton')}
          </Button>
        </section>
      </div>
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, locale } = ctx;

  const userId = parseUserIdParam(query.user);
  if (userId === null) {
    return notFound(ctx);
  }
  // Everybody's own settings and nobody else's: the server already knows who is asking
  if (store.getState().auth.initialUser?.id !== userId) return forbidden(ctx);

  let user: Optional<GetUsersIdResult>;
  try {
    user = await userFetcher({ id: userId })();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  titleSetter(store, titleFactory({ user: user || null }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['users'])),
      userId,
      user: user || null,
    },
  };
});

export default AccountPage;
