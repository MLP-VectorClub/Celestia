import { groupBy } from 'lodash';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { GetConfigResult, GetTagsResult, GuideName } from '@mlp-vectorclub/api-types';
import { GuideNotFound } from 'src/components/colorguide/GuideNotFound';
import { Tag } from 'src/components/colorguide/Tag';
import { NewTagButton, TagAdminActions } from 'src/components/colorguide/TagAdmin';
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

  const groups = useMemo(() => groupBy(data?.tags ?? [], (tag) => tag.type ?? ''), [data]);

  if (!guide) {
    return <GuideNotFound heading={t('colorGuide.notFound.unknownGuide')} noun={t('colorGuide.notFound.nouns.guide')} />;
  }

  return (
    <Content>
      <StandardHeading heading={t('colorGuide.tags.heading')} lead={t('colorGuide.tags.lead')} />
      {canManage && config && <NewTagButton page={page} tagTypes={config.tagTypes} />}
      <StatusAlert status={status} subject={t('colorGuide.tags.loadingSubject')} />
      {data?.tags.length === 0 && <NoResultsAlert message={t('colorGuide.tags.empty')} />}
      {data && data.tags.length > 0 && (
        <>
          <Pagination {...data.pagination} tooltipPos="bottom" />
          {Object.entries(groups).map(([type, tags]) => (
            <section key={type}>
              <h2>{type === '' ? t('colorGuide.tags.noType') : (config?.tagTypes[type] ?? type)}</h2>
              <ul className="list-unstyled">
                {tags.map((tag) => (
                  <li key={tag.id} className="mb-1">
                    <Tag tag={tag} guide={guide} />{' '}
                    <small className="text-muted">
                      {tag.synonymOf
                        ? t('colorGuide.tags.synonymOf', { name: tag.synonymOf.name })
                        : t('colorGuide.tags.uses', { count: tag.uses })}
                      {tag.title ? ` – ${tag.title}` : ''}
                    </small>
                    {canManage && config && <TagAdminActions tag={tag} page={page} tagTypes={config.tagTypes} />}
                  </li>
                ))}
              </ul>
            </section>
          ))}
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
