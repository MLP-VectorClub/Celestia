import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { GetUsersIdContributionsTypeResult, GetUsersIdResult } from '@mlp-vectorclub/api-types';
import { AppearanceLink } from 'src/components/colorguide/AppearanceLink';
import Content from 'src/components/shared/Content';
import ExternalLink from 'src/components/shared/ExternalLink';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import Pagination from 'src/components/shared/Pagination';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { PostLine } from 'src/components/users/PostLine';
import { contributionsFetcher, userFetcher } from 'src/fetchers';
import { useContributions, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError, notFound, permission } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { parseUserIdParam } from 'src/utils/profile';
import { createFavMeUrl } from 'src/utils/url';
import { validatePageParam } from 'src/utils/validate-page-param';

const CONTRIBUTION_TYPES = ['cms-provided', 'requests', 'reservations', 'finished-posts', 'fulfilled-requests'] as const;
type ContributionType = (typeof CONTRIBUTION_TYPES)[number];
const isContributionType = (value: unknown): value is ContributionType => CONTRIBUTION_TYPES.includes(value as ContributionType);

interface PropTypes {
  userId: number;
  type: ContributionType;
  page: number;
  user: Nullable<GetUsersIdResult>;
  initialData: Nullable<GetUsersIdContributionsTypeResult>;
}

const titleFactory: TitleFactory<Pick<PropTypes, 'user' | 'type'>> = ({ user, type }) => ({
  title: [`users.contributions.types.${type}`],
  breadcrumbs: [
    { label: ['users.profile.breadcrumb'] },
    ...(user ? [{ label: user.name, linkProps: { href: PATHS.USER_LONG(user) } }] : []),
    { label: [`users.contributions.types.${type}`], active: true },
  ],
});

const ContributionsPage: NextPage<PropTypes> = ({ userId, type, page, user, initialData }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { query } = useRouter();
  const currentPage = validatePageParam(query.page, page);
  const { data, status } = useContributions(
    { id: userId, type, page: currentPage },
    currentPage === page ? initialData || undefined : undefined
  );

  const titleData = useMemo(() => titleFactory({ user, type }), [user, type]);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading
        heading={t('users.contributions.heading', { type: t(`users.contributions.types.${type}`), name: user?.name ?? '' })}
      />
      <StatusAlert
        status={status}
        subject={t('users.contributions.loadingSubject')}
        errorMessage={type === 'requests' ? t('users.contributions.restricted') : undefined}
      />
      {data?.items.length === 0 && <NoResultsAlert message={t('users.contributions.empty')} />}
      {data && data.items.length > 0 && (
        <>
          <Pagination {...data.pagination} tooltipPos="bottom" />
          {data.items.map((item) =>
            'appearance' in item ? (
              <p key={item.appearance.id}>
                <AppearanceLink {...item.appearance} />
                {item.favMe && (
                  <>
                    {' '}
                    (<ExternalLink href={createFavMeUrl(item.favMe)}>{item.favMe}</ExternalLink>)
                  </>
                )}
              </p>
            ) : (
              <PostLine key={item.id} post={item} showReserver={type === 'fulfilled-requests'} />
            )
          )}
          <Pagination {...data.pagination} tooltipPos="top" listClassName="mb-0" />
        </>
      )}
      {user && <Link href={PATHS.USER_LONG(user)}>{t('users.contributions.backToProfile')}</Link>}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const userId = parseUserIdParam(query.user);
  if (userId === null || !isContributionType(query.type)) {
    return notFound(ctx);
  }
  const type = query.type;
  const page = validatePageParam(query.page);
  // The requests of a user are only for them and for staff, everybody else is told there is no such page
  const visitor = store.getState().auth.initialUser;
  if (type === 'requests' && visitor?.id !== userId && !permission(visitor, 'staff')) return notFound(ctx);

  let user: Optional<GetUsersIdResult>;
  let initialData: Optional<GetUsersIdContributionsTypeResult>;
  try {
    user = await userFetcher({ id: userId })();
    initialData = await contributionsFetcher({ id: userId, type, page }, req)();
  } catch (e) {
    // 401/403 for private lists and 404 for unknown users are passed on as the response status
    handleDataFetchingError(ctx, e);
  }

  titleSetter(store, titleFactory({ user: user || null, type }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['users'])),
      userId,
      type,
      page,
      user: user || null,
      initialData: initialData || null,
    },
  };
});

export default ContributionsPage;
