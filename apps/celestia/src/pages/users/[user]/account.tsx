import { GetUsersIdResult } from '@went.tf/mlp-vectorclub-api-types';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { Alert, Button } from 'reactstrap';

import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import { EmailChangeForm } from 'src/components/users/EmailChangeForm';
import { PasswordForm } from 'src/components/users/PasswordForm';
import { DiscordSection } from 'src/components/users/account/DiscordSection';
import { PasskeysSection } from 'src/components/users/account/PasskeysSection';
import { SessionsSection } from 'src/components/users/account/SessionsSection';
import { TwoFactorSection } from 'src/components/users/account/TwoFactorSection';
import { userFetcher } from 'src/fetchers';
import { useAuth, useTitleSetter, useUserProfile } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { forbidden, handleDataFetchingError, notFound, permission } from 'src/utils';
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

  const own = authUser.id === userId;

  // Links to a section (`/.well-known/change-password` goes to #security) land before the profile has loaded, which is what the section waits for
  const hasProfile = Boolean(profile);
  useEffect(() => {
    if (hasProfile && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [hasProfile]);
  const heading = (
    <StandardHeading
      heading={t('users.account.heading')}
      lead={own ? t('users.account.lead') : t('users.account.leadOther', { name: user?.name ?? '' })}
    />
  );

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

  // Anybody's own settings, and staff may look after anybody's
  if (!own && !isStaff) {
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
        <SessionsSection userId={userId} own={own} />
        {(own || (isStaff && profile)) && (
          <section id="security">
            <h2>
              <span title={t('users.profile.visibleTo.staff')} className="me-1">
                <InlineIcon icon="lock" size="sm" />
              </span>
              {t('users.account.security')}
            </h2>
            {profile && (own || permission(authUser, 'developer')) && (
              <>
                <EmailChangeForm profile={profile} sameUser={own} />
                {own && <PasswordForm passwordSet={Boolean(profile.account?.passwordSet)} />}
              </>
            )}
            {own && (
              <>
                <TwoFactorSection />
                <PasskeysSection />
              </>
            )}
          </section>
        )}
        {profile && <DiscordSection profile={profile} sameUser={own} />}
        {own && (
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
        )}
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
  // Everybody's own settings, staff may open anybody's: the server already knows who is asking
  const asking = store.getState().auth.initialUser;
  if (asking?.id !== userId && !(asking && permission(asking.role, 'staff'))) return forbidden(ctx);

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
