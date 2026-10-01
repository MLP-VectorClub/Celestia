import { IncomingMessage } from 'http';
import { GetServerSidePropsContext } from 'next';

import { GetPostsResult, GetShowIdResult, GetShowIdVoteResult, ShowListItem } from '@mlp-vectorclub/api-types';
import { ShowEntryPageProps, showTitleFactory } from 'src/components/show/ShowEntryPage';
import { latestShowFetcher, postsFetcher, showFetcher, showListLookupFetcher, showVoteFetcher } from 'src/fetchers';
import { PATHS } from 'src/paths';
import { wrapper } from 'src/store';
import { Optional, SSRMessages } from 'src/types';
import { ShowEntry } from 'src/types/api-alias';
import { fixPath, handleDataFetchingError, notFound } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

type ShowType = ShowListItem['type'];

/**
 * Turns the path segment into a show entry ID: `latest`, `S1E3` / `S1E3-title` (episodes), or a numeric `12` / `12-title`
 */
const resolveShowId = async (type: ShowType, segment: string, req: IncomingMessage): Promise<Optional<number>> => {
  if (type === 'episode' && segment === 'latest') {
    return (await latestShowFetcher(req)()).id;
  }

  if (type === 'episode') {
    const match = /^S(\d+)E(\d+)(?:-.*)?$/i.exec(segment);
    if (match) {
      const result = await showListLookupFetcher(
        { types: ['episode'], order: 'series', season: Number(match[1]), episode: Number(match[2]) },
        req
      )();
      return result.show[0]?.id;
    }
  }

  const numeric = /^(\d+)(?:-.*)?$/.exec(segment);
  return numeric ? Number(numeric[1]) : undefined;
};

/**
 * Shared by `/episode/[id]`, `/movie/[id]` and `/special/[id]`
 */
export const createShowGetServerSideProps = (type: ShowType) =>
  wrapper.getServerSideProps<ShowEntryPageProps & SSRMessages>((store) => async (ctx: GetServerSidePropsContext) => {
    const { query, req, locale } = ctx;

    if (typeof query.id !== 'string') return notFound(ctx);

    let id: Optional<number>;
    let show: Optional<GetShowIdResult>;
    try {
      id = await resolveShowId(type, query.id, req);
      if (id) show = await showFetcher({ id }, req)();
    } catch (e) {
      handleDataFetchingError(ctx, e);
    }

    if (!id || !show || (show.show as ShowEntry).type !== type) return notFound(ctx);

    const entry = show.show as ShowEntry;
    const expectedPath = PATHS.EPISODE(entry);
    const redirect = fixPath(ctx, expectedPath, ['id']);
    if (redirect) return { redirect };

    let requests: Optional<GetPostsResult>;
    let reservations: Optional<GetPostsResult>;
    let votes: Optional<GetShowIdVoteResult>;
    try {
      [requests, reservations, votes] = await Promise.all([
        postsFetcher({ showId: id, kind: 'request' }, req)(),
        postsFetcher({ showId: id, kind: 'reservation' }, req)(),
        entry.aired && type === 'episode' ? showVoteFetcher({ id }, req)() : Promise.resolve(undefined),
      ]);
    } catch (e) {
      handleDataFetchingError(ctx, e);
    }

    titleSetter(store, showTitleFactory({ show: entry }));
    return {
      props: {
        ...(await typedServerSideTranslations(locale, ['show'])),
        id,
        initialShow: show,
        initialRequests: requests || null,
        initialReservations: reservations || null,
        initialVotes: votes || null,
      },
    };
  });
