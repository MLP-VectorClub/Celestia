import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { Table } from 'reactstrap';

import { GetEventsResult } from '@mlp-vectorclub/api-types';
import Content from 'src/components/shared/Content';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import Pagination from 'src/components/shared/Pagination';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import TimeAgo from 'src/components/shared/TimeAgo';
import { eventsFetcher } from 'src/fetchers';
import { useEvents, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages, Translatable } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { validatePageParam } from 'src/utils/validate-page-param';

const titleFactory: TitleFactory<unknown> = () => {
  const title: Translatable = ['common.titles.events'];
  return { title, breadcrumbs: [{ label: title, active: true }] };
};

interface PropTypes {
  page: number;
  initialEvents: Nullable<GetEventsResult>;
}

const EventsPage: NextPage<PropTypes> = ({ page, initialEvents }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { query } = useRouter();
  const [now] = useState(() => Date.now());
  const currentPage = validatePageParam(query.page, page);
  const { data, status } = useEvents({ page: currentPage }, initialEvents && currentPage === page ? initialEvents : undefined);

  const titleData = useMemo(() => titleFactory({}), []);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading heading={t('events.list.heading')} lead={t('events.list.lead')} />
      <StatusAlert status={status} subject={t('events.list.loadingSubject')} />
      {data?.events.length === 0 && <NoResultsAlert message={t('events.list.empty')} />}
      {data && data.events.length > 0 && (
        <>
          <Pagination {...data.pagination} tooltipPos="bottom" />
          <Table responsive borderless>
            <tbody>
              {data.events.map((event) => {
                const state = event.finalizedAt ? 'finalized' : new Date(event.startsAt).getTime() > now ? 'upcoming' : 'ongoing';
                return (
                  <tr key={event.id}>
                    <td>
                      <Link href={PATHS.EVENT(event)}>{event.name}</Link>
                      <br />
                      <small className="text-muted">{t(`events.list.${state}`)}</small>
                    </td>
                    <td>
                      {t('events.list.starts')}: <TimeAgo date={event.startsAt} />
                      <br />
                      {t('events.list.ends')}: <TimeAgo date={event.endsAt} />
                    </td>
                    <td>
                      {event.maxEntries === null ? t('events.list.unlimited') : t('events.list.entryLimit', { count: event.maxEntries })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination {...data.pagination} tooltipPos="top" listClassName="mb-0" />
        </>
      )}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;
  const page = validatePageParam(query.page);

  let events: Optional<GetEventsResult>;
  try {
    events = await eventsFetcher({ page }, req)();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  titleSetter(store, titleFactory({}));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['events'])),
      page,
      initialEvents: events || null,
    },
  };
});

export default EventsPage;
