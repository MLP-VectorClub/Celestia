import { StatusCodes } from 'http-status-codes';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import pluralize from 'pluralize';
import { useMemo } from 'react';

import { GetEventsIdResult } from '@mlp-vectorclub/api-types';
import { EventEntries } from 'src/components/events/EventEntries';
import { EventFinishedImage } from 'src/components/events/EventFinishedImage';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import { LongDate } from 'src/components/shared/LongDate';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import TimeAgo from 'src/components/shared/TimeAgo';
import { eventFetcher } from 'src/fetchers';
import { useAuth, useEvent, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { DatabaseRole } from 'src/types/api-alias';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError, notFound } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { mapRoleLabel } from 'src/utils/role-label';
import { canonicalPathRedirect } from 'src/utils/url';

interface PropTypes {
  id: number;
  initialEvent: Nullable<GetEventsIdResult>;
}

const titleFactory: TitleFactory<{ event: Nullable<Pick<GetEventsIdResult, 'name'>> }> = ({ event }) => ({
  title: event ? event.name : ['events.details.notFound'],
  breadcrumbs: [
    { linkProps: { href: PATHS.EVENTS }, label: ['common.titles.events'] },
    { label: event ? event.name : ['events.details.notFound'], active: true },
  ],
});

const EventPage: NextPage<PropTypes> = ({ id, initialEvent }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { event, status } = useEvent({ id }, initialEvent || undefined);
  const { isStaff } = useAuth();

  const titleData = useMemo(() => titleFactory({ event: event || null }), [event]);
  useTitleSetter(dispatch, titleData);

  if (!event) {
    return (
      <Content>
        <StandardHeading heading={t('events.details.notFound')} lead={t('events.details.checkYourSpelling')} />
        <StatusAlert status={status} subject={t('events.details.loadingSubject')} />
      </Content>
    );
  }

  const roleName = event.entryRole?.startsWith('spec_')
    ? t('events.details.specialRoleDiscord')
    : pluralize(mapRoleLabel(t, (event.entryRole ?? 'user') as DatabaseRole), 2);

  return (
    <Content>
      <StandardHeading
        heading={event.name}
        lead={
          <>
            {t('events.details.collaborationFor', { role: roleName })} &bull; {t('events.details.ended')} <TimeAgo date={event.endsAt} />
          </>
        }
      />

      {event.resultFavMe && (
        <section>
          <h2>
            <InlineIcon icon="image" first size="xs" />
            {t('events.details.finishedImage')}
          </h2>
          <EventFinishedImage id={event.id} favMeId={event.resultFavMe} />
        </section>
      )}

      <section>
        <h2>
          <InlineIcon icon="info-circle" first size="xs" />
          {t('events.details.description')}
        </h2>
        {/* The API sends the description rendered and sanitized (the old site's rendering of the Markdown source) */}
        <div dangerouslySetInnerHTML={{ __html: event.descriptionHtml }} />
        <p>
          {t.rich('events.details.acceptedUntil', { time: () => <LongDate date={event.endsAt} /> })}{' '}
          {event.maxEntries !== null ? t('events.details.maxEntries', { count: event.maxEntries }) : t('events.details.unlimitedEntries')}
        </p>
        {event.ended && <p className="color-blue">{t('events.details.concluded')}</p>}
      </section>

      <section>
        <h2>
          <InlineIcon icon="users" first size="xs" />
          {t('events.details.entries', { count: event.entries.length })}
        </h2>
        {event.entries.length === 0 && <NoResultsAlert message={t('events.details.noEntries')} />}
        <EventEntries entries={event.entries} isStaff={isStaff} />
      </section>
      <Link href={PATHS.EVENTS}>{t('events.details.backToList')}</Link>
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const id = typeof query.id === 'string' ? parseInt(query.id, 10) : NaN;
  if (isNaN(id) || id < 1) {
    return notFound(ctx);
  }

  let event: Optional<GetEventsIdResult>;
  try {
    event = await eventFetcher({ id }, req)();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  if (event) {
    const canonical = canonicalPathRedirect(ctx.resolvedUrl, PATHS.EVENT(event));
    if (canonical) return { redirect: { destination: canonical, statusCode: StatusCodes.MOVED_PERMANENTLY } };
  }

  titleSetter(store, titleFactory({ event: event || null }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['events', 'show'])),
      id,
      initialEvent: event || null,
    },
  };
});

export default EventPage;
