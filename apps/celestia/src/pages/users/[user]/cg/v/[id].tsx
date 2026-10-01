import { NextPage } from 'next';
import { useMemo } from 'react';

import { GetAppearancesIdResult, GetUsersIdResult } from '@mlp-vectorclub/api-types';
import { AppearanceView } from 'src/components/colorguide/AppearanceView';
import { appearanceFetcher, userFetcher } from 'src/fetchers';
import { useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError, notFound } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { parseUserIdParam } from 'src/utils/profile';

interface PropTypes {
  id: number;
  userId: number;
  user: Nullable<GetUsersIdResult>;
  initialAppearance: Nullable<GetAppearancesIdResult>;
}

const titleFactory: TitleFactory<Pick<PropTypes, 'user' | 'userId' | 'initialAppearance'>> = ({ user, userId, initialAppearance }) => ({
  title: initialAppearance ? `${initialAppearance.label} - ${user?.name ?? ''}'s Personal Color Guide` : 'Personal Color Guide',
  breadcrumbs: [
    { label: ['users.profile.breadcrumb'] },
    ...(user ? [{ label: user.name, linkProps: { href: PATHS.USER_LONG(user) } }] : []),
    { label: ['users.personalGuide.breadcrumb'], linkProps: { href: PATHS.USER_PCG(userId) } },
    { label: initialAppearance ? initialAppearance.label : 'Appearance', active: true },
  ],
});

const PersonalGuideAppearancePage: NextPage<PropTypes> = ({ id, userId, user, initialAppearance }) => {
  const dispatch = useAppDispatch();
  const titleData = useMemo(() => titleFactory({ user, userId, initialAppearance }), [user, userId, initialAppearance]);
  useTitleSetter(dispatch, titleData);

  return <AppearanceView guide={null} id={id} initialAppearance={initialAppearance} />;
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const userId = parseUserIdParam(query.user);
  const id = parseUserIdParam(query.id);
  if (userId === null || id === null) {
    return notFound(ctx);
  }

  let user: Optional<GetUsersIdResult>;
  let appearance: Optional<GetAppearancesIdResult>;
  try {
    user = await userFetcher({ id: userId })();
    appearance = await appearanceFetcher({ id }, req)();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  // The appearance has to belong to the guide in the URL
  if (appearance && appearance.ownerId !== userId) {
    return notFound(ctx);
  }

  titleSetter(store, titleFactory({ user: user || null, userId, initialAppearance: appearance || null }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['colorGuide', 'users'])),
      id,
      userId,
      user: user || null,
      initialAppearance: appearance || null,
    },
  };
});

export default PersonalGuideAppearancePage;
