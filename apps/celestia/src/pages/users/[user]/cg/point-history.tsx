import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Button } from 'reactstrap';

import { GetUsersIdPersonalGuidePointHistoryResult, GetUsersIdResult } from '@went.tf/mlp-vectorclub-api-types';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import Pagination from 'src/components/shared/Pagination';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { PointHistoryTable } from 'src/components/users/PointHistoryTable';
import { RecalculateHistoryButton } from 'src/components/users/RecalculateHistoryButton';
import { pointHistoryFetcher, userFetcher } from 'src/fetchers';
import { useAuth, usePointHistory, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError, notFound, permission } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { parseUserIdParam } from 'src/utils/profile';
import { validatePageParam } from 'src/utils/validate-page-param';

interface PropTypes {
  userId: number;
  page: number;
  user: Nullable<GetUsersIdResult>;
  initialData: Nullable<GetUsersIdPersonalGuidePointHistoryResult>;
}

const titleFactory: TitleFactory<Pick<PropTypes, 'user' | 'userId'>> = ({ user, userId }) => ({
  title: ['users.pointHistory.heading', { name: user?.name ?? '' }],
  breadcrumbs: [
    { label: ['users.profile.breadcrumb'] },
    ...(user ? [{ label: user.name, linkProps: { href: PATHS.USER_LONG(user) } }] : []),
    { label: ['users.personalGuide.breadcrumb'], linkProps: { href: PATHS.USER_PCG(userId) } },
    { label: ['users.pointHistory.breadcrumb'], active: true },
  ],
});

const PointHistoryPage: NextPage<PropTypes> = ({ userId, page, user, initialData }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { query } = useRouter();
  const { user: me } = useAuth();
  const ownHistory = me.id !== null && me.id === userId;
  const currentPage = validatePageParam(query.page, page);
  const { data, status } = usePointHistory({ id: userId, page: currentPage }, currentPage === page ? initialData || undefined : undefined);

  const titleData = useMemo(() => titleFactory({ user, userId }), [user, userId]);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading
        heading={ownHistory ? t('users.pointHistory.headingOwn') : t('users.pointHistory.heading', { name: user?.name ?? '' })}
        lead={data ? t('users.pointHistory.itemsPerPage', { count: data.pagination.itemsPerPage }) : undefined}
      />
      <ButtonCollection>
        <Button tag={Link} href={PATHS.USER(userId)} color="guide-link" size="sm">
          <InlineIcon icon="user" first />
          {t('users.pointHistory.profilePage')}
        </Button>
        {permission(me, 'developer') && <RecalculateHistoryButton userId={userId} />}
      </ButtonCollection>
      <StatusAlert status={status} subject={t('users.pointHistory.loadingSubject')} errorMessage={t('users.pointHistory.forbidden')} />
      {data?.entries.length === 0 && <NoResultsAlert message={t('users.pointHistory.empty')} />}
      {data && data.entries.length > 0 && (
        <>
          <Pagination {...data.pagination} tooltipPos="bottom" />
          <PointHistoryTable entries={data.entries} ownerId={userId} />
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
  let initialData: Optional<GetUsersIdPersonalGuidePointHistoryResult>;
  try {
    user = await userFetcher({ id: userId })();
    initialData = await pointHistoryFetcher({ id: userId, page }, req)();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  titleSetter(store, titleFactory({ user: user || null, userId }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['users', 'colorGuide'])),
      userId,
      page,
      user: user || null,
      initialData: initialData || null,
    },
  };
});

export default PointHistoryPage;
