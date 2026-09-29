import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Table } from 'reactstrap';

import { GetColorGuideMajorChangesResult, GuideName } from '@mlp-vectorclub/api-types';
import styles from 'modules/GuideChangesPage.module.scss';
import { AppearanceLink } from 'src/components/colorguide/AppearanceLink';
import { GuideNotFound } from 'src/components/colorguide/GuideNotFound';
import ReturnToGuideButton from 'src/components/colorguide/ReturnToGuideButton';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import Pagination from 'src/components/shared/Pagination';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import TimeAgo from 'src/components/shared/TimeAgo';
import UserLink from 'src/components/shared/UserLink';
import { majorChangesFetcher } from 'src/fetchers';
import { useMajorChanges, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { AppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages, Translatable } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { getGuideLabel, handleDataFetchingError, notFound, resolveGuideName } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { validatePageParam } from 'src/utils/validate-page-param';

interface PropTypes {
  guide: Nullable<GuideName>;
  page: number;
  initialData: Nullable<GetColorGuideMajorChangesResult>;
}

const titleFactory: TitleFactory<Omit<PropTypes, 'initialData'>> = ({ guide, page }) => {
  const title: Translatable = ['colorGuide.changes.title', { page, guideName: getGuideLabel(guide) }];
  const guideLinkProps = guide ? { href: PATHS.GUIDE(guide) } : undefined;
  return {
    title,
    breadcrumbs: [
      {
        linkProps: { href: PATHS.GUIDE_INDEX },
        label: ['colorGuide.index.breadcrumb'],
      },
      { linkProps: guideLinkProps, label: getGuideLabel(guide) },
      { label: ['colorGuide.changes.breadcrumb'], active: true },
    ],
  };
};

const PAGING_RELEVANT_PROPS: string[] = [];

const GuideChangesPage: NextPage<PropTypes> = ({ guide, page, initialData }) => {
  const t = useTranslations();
  const dispatch = useDispatch<AppDispatch>();
  const heading = t('colorGuide.changes.heading', {
    guideName: getGuideLabel(guide),
  });
  const data = useMajorChanges({ guide, page }, initialData || undefined);

  const titleData = useMemo(() => titleFactory({ guide, page }), [guide, page]);
  useTitleSetter(dispatch, titleData);

  if (guide === null) {
    return <GuideNotFound heading={heading} />;
  }

  return (
    <Content>
      <StandardHeading
        heading={heading}
        lead={
          data.pagination
            ? t('common.pagination.itemsPerPage', {
                count: data.pagination.itemsPerPage,
              })
            : null
        }
      />
      <ButtonCollection>
        <ReturnToGuideButton guide={guide} />
      </ButtonCollection>

      <StatusAlert status={data.status} subject={t('colorGuide.changes.loadingSubject')} />
      {data.changes?.length === 0 && <NoResultsAlert message={t('colorGuide.changes.noResults')} />}

      {data.pagination && <Pagination {...data.pagination} relevantProps={PAGING_RELEVANT_PROPS} tooltipPos="bottom" />}
      {data.changes && (
        <Table borderless responsive className={styles.changes}>
          <thead>
            <tr>
              <th>{t('colorGuide.changes.columns.appearance')}</th>
              <th className="text-start">{t('colorGuide.changes.columns.reason')}</th>
              <th>{t('colorGuide.changes.columns.created')}</th>
            </tr>
          </thead>
          <tbody>
            {data.changes.map((c) => (
              <tr key={c.id}>
                <td>
                  <AppearanceLink {...c.appearance} />
                </td>
                <td className="text-start">{c.reason}</td>
                <td>
                  <div>
                    <InlineIcon icon="clock" first />
                    <TimeAgo date={c.createdAt} />
                  </div>
                  {c.user && (
                    <div>
                      <InlineIcon icon="user" first />
                      <UserLink {...c.user} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data.pagination && <Pagination {...data.pagination} relevantProps={PAGING_RELEVANT_PROPS} tooltipPos="top" listClassName="mb-0" />}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const guide = resolveGuideName(query.guide) || null;
  if (!guide) {
    return notFound(ctx);
  }

  const page = validatePageParam(query.page);

  let majorChanges: Optional<GetColorGuideMajorChangesResult>;
  if (guide) {
    try {
      majorChanges = await majorChangesFetcher({ guide, page }, req)();
    } catch (e) {
      handleDataFetchingError(ctx, e);
    }
  }

  const props: PropTypes = {
    guide,
    page,
    initialData: majorChanges || null,
  };
  titleSetter(store, titleFactory(props));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['colorGuide'])),
      ...props,
    },
  };
});
export default GuideChangesPage;
