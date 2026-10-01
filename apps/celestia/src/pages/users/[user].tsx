import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

import { GetUsersIdProfileResult, GetUsersIdResult } from '@mlp-vectorclub/api-types';
import AvatarWrap from 'src/components/shared/AvatarWrap';
import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { ProfileAwaitingApproval, ProfileContributions, ProfilePersonalGuides } from 'src/components/users/ProfileSections';
import { profileFetcher, userFetcher } from 'src/fetchers';
import { transformProfileParams, useAuth, useTitleSetter, useUser, useUserProfile } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { coreActions } from 'src/store/slices';
import { BreadcrumbEntry, Nullable, Optional, SSRMessages } from 'src/types';
import { PublicUser } from 'src/types/api-alias';
import { TitleFactory } from 'src/types/title';
import { fixPath, getProfileTitle, handleDataFetchingError, mapRoleLabel } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

interface PropTypes {
  initialUser: Nullable<PublicUser>;
  initialProfile: Nullable<GetUsersIdProfileResult>;
}

const titleFactory: TitleFactory<Pick<PropTypes, 'initialUser'> & { isStaff?: boolean }> = ({ initialUser, isStaff = false }) => {
  const firstBreadcrumb: BreadcrumbEntry = {
    label: ['users.profile.breadcrumb'],
  };
  if (isStaff) firstBreadcrumb.linkProps = { href: PATHS.USERS };
  return {
    title: getProfileTitle(initialUser),
    breadcrumbs: [
      firstBreadcrumb,
      {
        label: initialUser ? initialUser.name : ['users.profile.unknownUser'],
        active: true,
      },
    ],
  };
};

const ProfilePage: NextPage<PropTypes> = ({ initialUser, initialProfile }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { query } = useRouter();
  const { user } = useUser(transformProfileParams(query), initialUser || undefined);
  const { profile } = useUserProfile({ id: user?.id ?? initialUser?.id ?? 0 }, initialProfile || undefined);
  const { user: authUser, isStaff } = useAuth();

  useEffect(() => {
    dispatch(coreActions.setTitle(getProfileTitle(user, authUser.id)));
  }, [authUser, dispatch, user]);

  const titleData = useMemo(() => titleFactory({ initialUser: user || null, isStaff }), [user, isStaff]);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      {!user && <StandardHeading heading={t('users.profile.notFound')} lead={t('users.profile.checkYourSpelling')} />}
      {user && (
        <>
          <div className="d-flex justify-content-center align-items-center mb-2">
            <AvatarWrap avatarUrl={user.avatarUrl} avatarProvider={user.avatarProvider} size={75} className="flex-grow-0" />
          </div>
          <StandardHeading heading={user.name} lead={mapRoleLabel(t, user.role)} />
        </>
      )}
      {profile && (
        <>
          {profile.previousUsernames && profile.previousUsernames.length > 0 && (
            <p className="text-center text-muted">
              {t('users.profile.previousUsernames')}: {profile.previousUsernames.join(', ')}
            </p>
          )}
          {profile.discordServerMember && <p className="text-center text-muted">{t('users.profile.discordMember')}</p>}
          <ProfileAwaitingApproval profile={profile} />
          <ProfilePersonalGuides profile={profile} />
          <ProfileContributions profile={profile} />
        </>
      )}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const params = transformProfileParams(query);

  let initialUser: Optional<GetUsersIdResult>;
  let initialProfile: Optional<GetUsersIdProfileResult>;
  try {
    initialUser = await userFetcher(params)();
    initialProfile = await profileFetcher({ id: initialUser.id }, req)();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  if (initialUser) {
    const expectedPath = PATHS.USER_LONG(initialUser);
    const redirect = fixPath(ctx, expectedPath, ['user']);
    if (redirect) {
      return { redirect };
    }
  }

  const props: PropTypes = {
    initialUser: initialUser || null,
    initialProfile: initialProfile || null,
  };
  titleSetter(store, titleFactory(props));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['users'])),
      ...props,
    },
  };
});

export default ProfilePage;
