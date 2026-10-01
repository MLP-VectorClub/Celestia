import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { Alert, Card, CardBody, CardText, CardTitle, Col, Row } from 'reactstrap';

import { GetEventsIdResult } from '@mlp-vectorclub/api-types';
import Content from 'src/components/shared/Content';
import ExternalLink from 'src/components/shared/ExternalLink';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import TimeAgo from 'src/components/shared/TimeAgo';
import UserLink from 'src/components/shared/UserLink';
import { eventFetcher } from 'src/fetchers';
import { useEvent, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError, notFound } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { createFavMeUrl } from 'src/utils/url';

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

  return (
    <Content>
      <StandardHeading heading={event.name} lead={t('events.details.addedBy', { name: event.addedBy.name })} />
      <p>
        {t('events.list.starts')}: <TimeAgo date={event.startsAt} /> · {t('events.list.ends')}: <TimeAgo date={event.endsAt} />
      </p>
      {event.resultFavMe && (
        <Alert color="success" fade={false}>
          {t('events.details.winner')}:{' '}
          <ExternalLink href={createFavMeUrl(event.resultFavMe)}>{createFavMeUrl(event.resultFavMe)}</ExternalLink>
        </Alert>
      )}
      {event.descriptionSrc && <p style={{ whiteSpace: 'pre-wrap' }}>{event.descriptionSrc}</p>}
      <Alert color="ui" fade={false}>
        {t('events.details.entriesDisabled')}
      </Alert>
      <h2>{t('events.details.entries', { count: event.entries.length })}</h2>
      {event.entries.length === 0 && <NoResultsAlert message={t('events.details.noEntries')} />}
      <Row>
        {event.entries.map((entry) => (
          <Col key={entry.id} xs="12" sm="6" lg="4" className="mb-3">
            <Card>
              {entry.previewUrl && (
                <Image src={entry.previewUrl} alt={entry.title} width={400} height={300} unoptimized className="card-img-top" />
              )}
              <CardBody>
                <CardTitle tag="h3" className="h5">
                  {entry.fullUrl ? <ExternalLink href={entry.fullUrl}>{entry.title}</ExternalLink> : entry.title}
                </CardTitle>
                <CardText>
                  {t('events.details.submittedBy', { name: '' })}
                  <UserLink id={entry.submittedBy.id} name={entry.submittedBy.name} />
                </CardText>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
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

  titleSetter(store, titleFactory({ event: event || null }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['events'])),
      id,
      initialEvent: event || null,
    },
  };
});

export default EventPage;
