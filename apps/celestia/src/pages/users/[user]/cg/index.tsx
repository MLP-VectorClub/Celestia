import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Button } from 'reactstrap';

import { GetUsersIdPersonalGuideAppearancesResult, GetUsersIdResult } from '@mlp-vectorclub/api-types';
import { useColorCopyWidget } from 'src/components/colorguide/ColorCopyWidget';
import { AppearanceCreateButton } from 'src/components/colorguide/AppearanceCreateButton';
import AppearanceItem from 'src/components/colorguide/AppearanceItem';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import Pagination from 'src/components/shared/Pagination';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { personalGuideFetcher, userFetcher } from 'src/fetchers';
import { useAuth, usePersonalGuide, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError, notFound } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { parseUserIdParam } from 'src/utils/profile';
import { validatePageParam } from 'src/utils/validate-page-param';

interface PropTypes {
  userId: number;
  page: number;
  user: Nullable<GetUsersIdResult>;
  initialData: Nullable<GetUsersIdPersonalGuideAppearancesResult>;
}

const titleFactory: TitleFactory<Pick<PropTypes, 'user'>> = ({ user }) => ({
  title: ['users.personalGuide.heading', { name: user?.name ?? '' }],
  breadcrumbs: [
    { label: ['users.profile.breadcrumb'] },
    ...(user ? [{ label: user.name, linkProps: { href: PATHS.USER_LONG(user) } }] : []),
    { label: ['users.personalGuide.breadcrumb'], active: true },
  ],
});

const PersonalGuidePage: NextPage<PropTypes> = ({ userId, page, user, initialData }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { query } = useRouter();
  const { user: visitor } = useAuth();
  const currentPage = validatePageParam(query.page, page);
  const { data, status } = usePersonalGuide({ id: userId, page: currentPage }, currentPage === page ? initialData || undefined : undefined);

  const titleData = useMemo(() => titleFactory({ user }), [user]);
  useTitleSetter(dispatch, titleData);
  useColorCopyWidget();

  return (
    <Content>
      <StandardHeading heading={t('users.personalGuide.heading', { name: user?.name ?? '' })} lead={t('users.personalGuide.lead')} />
      <ButtonCollection>
        {visitor.id === userId && <AppearanceCreateButton kind="pony" ownerId={userId} />}
        <Link href={PATHS.USER_PCG_POINT_HISTORY(userId)} passHref legacyBehavior>
          <Button color="link" size="sm">
            {t('users.personalGuide.pointHistory')}
          </Button>
        </Link>
      </ButtonCollection>
      <StatusAlert status={status} subject={t('users.personalGuide.loadingSubject')} />
      {data?.appearances.length === 0 && <NoResultsAlert message={t('users.personalGuide.empty')} />}
      {data && data.appearances.length > 0 && (
        <>
          <Pagination {...data.pagination} tooltipPos="bottom" />
          {data.appearances.map((a) =>
            'colorGroups' in a ? (
              <AppearanceItem key={a.id} appearance={a} />
            ) : (
              <p key={a.id} className="text-muted">
                <span className="typcn-lock-closed me-1">
                  <InlineIcon icon="lock" />
                </span>
                {t('users.personalGuide.private')}: {a.label}
              </p>
            )
          )}
          <Pagination {...data.pagination} tooltipPos="top" listClassName="mb-0" />
        </>
      )}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const userId = parseUserIdParam(query.user);
  if (userId === null) {
    return notFound(ctx);
  }
  const page = validatePageParam(query.page);

  let user: Optional<GetUsersIdResult>;
  let initialData: Optional<GetUsersIdPersonalGuideAppearancesResult>;
  try {
    user = await userFetcher({ id: userId })();
    initialData = await personalGuideFetcher({ id: userId, page }, req)();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  titleSetter(store, titleFactory({ user: user || null }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['colorGuide', 'users'])),
      userId,
      page,
      user: user || null,
      initialData: initialData || null,
    },
  };
});

export default PersonalGuidePage;
