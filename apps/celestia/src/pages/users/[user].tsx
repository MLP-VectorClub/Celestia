import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

import { GetUsersIdResult } from '@mlp-vectorclub/api-types';
import AvatarWrap from 'src/components/shared/AvatarWrap';
import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { userFetcher } from 'src/fetchers';
import { transformProfileParams, useAuth, useTitleSetter, useUser } from 'src/hooks';
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

const ProfilePage: NextPage<PropTypes> = ({ initialUser }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { query } = useRouter();
  const { user } = useUser(transformProfileParams(query), initialUser || undefined);
  const { user: authUser, isStaff } = useAuth();
  // TODO Return limited set of user prefs

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
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, locale } = ctx;

  const params = transformProfileParams(query);

  let initialUser: Optional<GetUsersIdResult>;
  if ('id' in params || 'username' in params) {
    try {
      initialUser = await userFetcher(params)();
    } catch (e) {
      handleDataFetchingError(ctx, e);
    }
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
