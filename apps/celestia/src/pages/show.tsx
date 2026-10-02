import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Col, Row } from 'reactstrap';

import { GetShowResult } from '@mlp-vectorclub/api-types';
import styles from 'modules/ShowPage.module.scss';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { AddEntryButton } from 'src/components/show/AddEntryButton';
import { ShowEntriesTable, ShowEntriesTableProps } from 'src/components/show/ShowEntriesTable';
import { EpisodeColumn, EpisodeNumberColumn, SeasonColumn, ShowNumberColumn, TitleAirDateColumn } from 'src/components/show/columns';
import { showListFetcher } from 'src/fetchers/show';
import { useAuth } from 'src/hooks';
import { useTitleSetter } from 'src/hooks/core';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, SSRMessages, Translatable } from 'src/types';
import { ShowTableColumnDefinition } from 'src/types/show';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { validatePageParam } from 'src/utils/validate-page-param';

interface ShowPageProps {
  initialEpisodes: Nullable<GetShowResult>;
  initialOthers: Nullable<GetShowResult>;
}

const EPISODE_TABLE_PARAMS: ShowEntriesTableProps['params'] = {
  order: 'series',
  types: ['episode'],
};
const OTHERS_TABLE_PARAMS: ShowEntriesTableProps['params'] = {
  order: 'overall',
  types: ['movie', 'short', 'special'],
};

const TITLE_AIR_DATE_COLUMN: ShowTableColumnDefinition = {
  header: 'Title & Air Date',
  renderContent: TitleAirDateColumn,
};

const EPISODE_TABLE_COLUMNS: ShowEntriesTableProps['columns'] = [
  {
    header: '№',
    only: 'mobile',
    tdClassName: styles.identifier,
    renderContent: EpisodeNumberColumn,
  },
  {
    header: 'Season',
    only: 'desktop',
    tdClassName: styles.identifier,
    renderContent: SeasonColumn,
  },
  {
    header: 'Episode',
    only: 'desktop',
    tdClassName: styles.identifier,
    renderContent: EpisodeColumn,
  },
  TITLE_AIR_DATE_COLUMN,
];
const OTHERS_TABLE_COLUMNS: ShowEntriesTableProps['columns'] = [
  {
    header: 'Overall #',
    shortHeader: '#',
    tdClassName: styles.identifier,
    renderContent: ShowNumberColumn,
  },
  TITLE_AIR_DATE_COLUMN,
];

const titleFactory: TitleFactory = () => {
  const title: Translatable = ['common.titles.show'];
  return {
    title,
    breadcrumbs: [
      {
        label: title,
        active: true,
      },
    ],
  };
};

const ShowPage: NextPage<ShowPageProps> = ({ initialEpisodes, initialOthers }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);
  const { isStaff } = useAuth();
  return (
    <Content>
      <Row>
        <Col xs={12} xl className={`mb-3 mb-xl-0 ${styles.column}`}>
          <StandardHeading heading={t('show.index.episodes.heading')} />
          {isStaff && (
            <ButtonCollection>
              <AddEntryButton noun={t('show.index.episodes.addNoun')} category="episode" />
            </ButtonCollection>
          )}
          <ShowEntriesTable
            columns={EPISODE_TABLE_COLUMNS}
            initialData={initialEpisodes}
            pageQueryParam="eppage"
            params={EPISODE_TABLE_PARAMS}
          />
        </Col>
        <Col xs={12} xl className={styles.column}>
          <StandardHeading heading={t('show.index.others.heading')} />
          {isStaff && (
            <ButtonCollection>
              <AddEntryButton noun={t('show.index.others.addNoun')} category="other" />
            </ButtonCollection>
          )}
          <ShowEntriesTable columns={OTHERS_TABLE_COLUMNS} initialData={initialOthers} params={OTHERS_TABLE_PARAMS} />
        </Col>
      </Row>
    </Content>
  );
};

export default ShowPage;

export const getServerSideProps = wrapper.getServerSideProps<ShowPageProps & SSRMessages>((store) => async (ctx) => {
  const { query, locale } = ctx;
  const props: ShowPageProps = {
    initialOthers: null,
    initialEpisodes: null,
  };

  const epPage = validatePageParam(query.eppage);

  try {
    props.initialEpisodes = await showListFetcher({
      ...EPISODE_TABLE_PARAMS,
      page: epPage,
    })();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  const page = validatePageParam(query.page);
  try {
    props.initialOthers = await showListFetcher({
      ...OTHERS_TABLE_PARAMS,
      page,
    })();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  titleSetter(store, titleFactory());
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['show'])),
      ...props,
    },
  };
});
