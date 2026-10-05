import { NextPage } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Button } from 'reactstrap';

import { GetConfigResult, GetTagsResult, GuideName } from '@mlp-vectorclub/api-types';
import { GuideNotFound } from 'src/components/colorguide/GuideNotFound';
import tableStyles from 'modules/TagsTable.module.scss';
import { NewTagButton, RefreshAllButton, TagRowActions, TagUses } from 'src/components/colorguide/TagAdmin';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import InlineIcon from 'src/components/shared/InlineIcon';
import Content from 'src/components/shared/Content';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import Pagination from 'src/components/shared/Pagination';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { configFetcher, tagsFetcher } from 'src/fetchers';
import { useAuth, useConfig, useTags, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { getGuideLabel, handleDataFetchingError, resolveGuideName } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { validatePageParam } from 'src/utils/validate-page-param';

const titleFactory: TitleFactory<{ guide: Nullable<GuideName> }> = ({ guide }) => ({
  title: ['colorGuide.tags.heading'],
  breadcrumbs: [
    { linkProps: { href: PATHS.GUIDE_INDEX }, label: ['colorGuide.index.breadcrumb'] },
    ...(guide ? [{ linkProps: { href: PATHS.GUIDE(guide) }, label: getGuideLabel(guide) }] : []),
    { label: ['colorGuide.tags.breadcrumb'], active: true },
  ],
});

interface PropTypes {
  guide: Nullable<GuideName>;
  page: number;
  initialTags: Nullable<GetTagsResult>;
  initialConfig: Nullable<GetConfigResult>;
}

const TagsPage: NextPage<PropTypes> = ({ guide, page, initialTags, initialConfig }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { data, status } = useTags({ page }, initialTags || undefined);
  const { config } = useConfig(initialConfig || undefined);
  const { isStaff } = useAuth();
  const canManage = isStaff && Boolean(data?.canEdit) && Boolean(config);

  const titleData = useMemo(() => titleFactory({ guide }), [guide]);
  useTitleSetter(dispatch, titleData);

  if (!guide) {
    return <GuideNotFound heading={t('colorGuide.notFound.unknownGuide')} noun={t('colorGuide.notFound.nouns.guide')} />;
  }

  const tagsList = data?.tags ?? [];
  return (
    <Content>
      <StandardHeading heading={t('colorGuide.tags.heading')} lead={t('colorGuide.tags.perPage', { count: data?.pagination.itemsPerPage ?? 50 })} />
      <ButtonCollection>
        <Button tag={Link} href={PATHS.GUIDE_INDEX} color="guide-link">
          <InlineIcon icon="arrow-circle-left" first />
          {t('colorGuide.tags.returnToGuides')}
        </Button>
        <Button tag={Link} href={PATHS.GUIDE_CHANGES(guide)} color="guide-link">
          <InlineIcon icon="exclamation-triangle" first />
          {t('colorGuide.nav.majorChanges')}
        </Button>
        {canManage && config && <NewTagButton page={page} tagTypes={config.tagTypes} />}
      </ButtonCollection>
      <StatusAlert status={status} subject={t('colorGuide.tags.loadingSubject')} />
      {data?.tags.length === 0 && <NoResultsAlert message={t('colorGuide.tags.empty')} />}
      {data && data.tags.length > 0 && (
        <>
          <Pagination {...data.pagination} tooltipPos="bottom" />
          <table id="tags" className={tableStyles.tags}>
            <thead>
              <tr>
                <th className="tid">ID</th>
                <th className="name" colSpan={canManage ? 2 : 1}>
                  {t('colorGuide.tags.nameColumn')}
                </th>
                <th className="title">{t('colorGuide.tags.descriptionColumn')}</th>
                <th className="type">{t('colorGuide.tags.typeColumn')}</th>
                <th className="uses">
                  {t('colorGuide.tags.usesColumn')} {canManage && <RefreshAllButton ids={tagsList.filter((tag) => !tag.synonymOf).map((tag) => tag.id)} page={page} />}
                </th>
              </tr>
            </thead>
            <tbody>
              {tagsList.map((tag) => (
                <tr key={tag.id} className={`${tableStyles.row} ${tag.type ? tableStyles[tag.type] ?? '' : ''} typ-${tag.type ?? ''}`}>
                  <td className="tid">{tag.id}</td>
                  <td className="name">
                    <Link href={PATHS.GUIDE(guide, { q: tag.name })} title={t('colorGuide.tags.searchFor', { name: tag.name })}>
                      <InlineIcon icon="search" first size="sm" />
                      {tag.name}
                    </Link>
                  </td>
                  {canManage && config && (
                    <td className="utils text-center">
                      <TagRowActions tag={tag} page={page} tagTypes={config.tagTypes} />
                    </td>
                  )}
                  <td className="title">
                    {tag.title}
                    {tag.synonymOf && (
                      <>
                        {tag.title && <br />}
                        <em>
                          {t('colorGuide.tags.synonymOfLabel')} <strong>{tag.synonymOf.name}</strong>
                        </em>
                      </>
                    )}
                  </td>
                  <td className="type">{tag.type ? (config?.tagTypes[tag.type] ?? tag.type) : ''}</td>
                  <td className="uses">
                    <TagUses tag={tag} page={page} canRecount={canManage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...data.pagination} tooltipPos="top" listClassName="mb-0" />
        </>
      )}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const guide = resolveGuideName(query.guide) || null;
  const page = validatePageParam(query.page);

  let tags: Optional<GetTagsResult>;
  let config: Optional<GetConfigResult>;
  if (guide) {
    try {
      [tags, config] = await Promise.all([tagsFetcher({ page }, req)(), configFetcher(req)()]);
    } catch (e) {
      handleDataFetchingError(ctx, e);
    }
  }

  titleSetter(store, titleFactory({ guide }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['colorGuide'])),
      guide,
      page,
      initialTags: tags || null,
      initialConfig: config || null,
    },
  };
});

export default TagsPage;
