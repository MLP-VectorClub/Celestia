import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  GetConfigResult,
  GetEventsIdFinishedImageResult,
  GetEventsIdRequest,
  GetEventsIdResult,
  GetEventsRequest,
  GetEventsResult,
  GetPostsIdDeviationResult,
  GetPostsRequest,
  GetPostsResult,
  GetShowIdAdjacentResult,
  GetShowIdRequest,
  GetShowIdResult,
  GetShowIdVoteRequest,
  GetShowIdVoteResult,
  GetShowReservationInfoResult,
  GetTagsRequest,
  GetTagsResult,
  GetUsersIdContributionsTypeRequest,
  GetUsersIdContributionsTypeResult,
  GetUsersIdPersonalGuideAppearancesRequest,
  GetUsersIdPersonalGuideAppearancesResult,
  GetUsersIdPersonalGuidePointHistoryRequest,
  GetUsersIdPersonalGuidePointHistoryResult,
  GetUsersIdProfileRequest,
  GetUsersIdProfileResult,
} from '@mlp-vectorclub/api-types';
import {
  configFetcher,
  contributionsFetcher,
  eventFetcher,
  eventFinishedImageFetcher,
  eventsFetcher,
  personalGuideFetcher,
  pointHistoryFetcher,
  postDeviationFetcher,
  postsFetcher,
  profileFetcher,
  reservationInfoFetcher,
  showAdjacentFetcher,
  showFetcher,
  showVoteFetcher,
  tagsFetcher,
  upcomingShowsFetcher,
} from 'src/fetchers';
import { Status } from 'src/types';
import { ENDPOINTS, mapQueryStatus } from 'src/utils';
import { compilePatterns } from 'src/utils/config';

/** Constants and validation patterns from `GET /config`, fetched once per session */
export function useConfig(initialData?: GetConfigResult) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.CONFIG],
    queryFn: configFetcher(),
    initialData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const patterns = useMemo(() => (data ? compilePatterns(data.patterns) : undefined), [data]);

  return { config: data, patterns, status: mapQueryStatus(status, fetchStatus) };
}

export function useEvents(params: GetEventsRequest, initialData?: GetEventsResult) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.EVENTS(params)],
    queryFn: eventsFetcher(params),
    initialData,
  });
  return { data, status: mapQueryStatus(status, fetchStatus) };
}

export function useEvent(params: GetEventsIdRequest, initialData?: GetEventsIdResult) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.EVENT(params)],
    queryFn: eventFetcher(params),
    initialData,
  });
  return { event: data, status: mapQueryStatus(status, fetchStatus) };
}

export function useTags(params: GetTagsRequest, initialData?: GetTagsResult) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.TAGS(params)],
    queryFn: tagsFetcher(params),
    initialData,
  });
  return { data, status: mapQueryStatus(status, fetchStatus) };
}

export function useUserProfile(params: GetUsersIdProfileRequest, initialData?: GetUsersIdProfileResult) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.USER_PROFILE(params)],
    queryFn: profileFetcher(params),
    enabled: params.id > 0,
    initialData,
  });
  return { profile: data, status: mapQueryStatus(status, fetchStatus) };
}

export function useContributions(params: GetUsersIdContributionsTypeRequest, initialData?: GetUsersIdContributionsTypeResult) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.USER_CONTRIBUTIONS(params)],
    queryFn: contributionsFetcher(params),
    initialData,
  });
  return { data, status: mapQueryStatus(status, fetchStatus) };
}

export function usePersonalGuide(
  params: GetUsersIdPersonalGuideAppearancesRequest,
  initialData?: GetUsersIdPersonalGuideAppearancesResult
) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.USER_PCG_APPEARANCES(params)],
    queryFn: personalGuideFetcher(params),
    initialData,
  });
  return { data, status: mapQueryStatus(status, fetchStatus) };
}

export function usePointHistory(
  params: GetUsersIdPersonalGuidePointHistoryRequest,
  initialData?: GetUsersIdPersonalGuidePointHistoryResult
) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.USER_PCG_POINT_HISTORY(params)],
    queryFn: pointHistoryFetcher(params),
    initialData,
  });
  return { data, status: mapQueryStatus(status, fetchStatus) };
}

export function useShowEntry(params: GetShowIdRequest, initialData?: GetShowIdResult) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.SHOW_BY_ID(params)],
    queryFn: showFetcher(params),
    initialData,
  });
  return { show: data?.show, status: mapQueryStatus(status, fetchStatus) };
}

export function useShowVotes(params: GetShowIdVoteRequest, initialData?: GetShowIdVoteResult) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.SHOW_VOTE(params)],
    queryFn: showVoteFetcher(params),
    initialData,
  });
  return { votes: data?.data, status: mapQueryStatus(status, fetchStatus) };
}

export function usePosts(params: GetPostsRequest, initialData?: GetPostsResult) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: [ENDPOINTS.POSTS(params)],
    queryFn: postsFetcher(params),
    initialData,
  });
  return { posts: data?.posts, status: mapQueryStatus(status, fetchStatus) };
}

export function useShowAdjacent(params: GetShowIdRequest, initialData?: GetShowIdAdjacentResult) {
  const { data } = useQuery({ queryKey: [ENDPOINTS.SHOW_ADJACENT(params)], queryFn: showAdjacentFetcher(params), initialData });
  return data;
}

/** The show entries that air within 6 months, for the sidebar. Asked again every few minutes, an entry drops out of the list once it has aired */
export function useUpcomingShows() {
  const { data } = useQuery({
    queryKey: [ENDPOINTS.SHOW_UPCOMING],
    queryFn: upcomingShowsFetcher(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
  return data?.show ?? [];
}

/** What the API answers with (202) while it fetches DeviantArt's details in the background */
interface PendingAnswer {
  pending: true;
  retryAfter: number;
}
const isPending = (data: unknown): data is PendingAnswer => typeof data === 'object' && data !== null && 'pending' in data;
const MAX_PENDING_CHECKS = 12;

/** Asks again while the API is still fetching the submission (up to a minute or so); an answer that never arrives counts as a failed lookup */
function useSubmissionQuery<T>(queryKey: string, queryFn: () => Promise<T>, enabled: boolean) {
  const client = useQueryClient();
  const { data, status, fetchStatus } = useQuery<T | PendingAnswer>({
    queryKey: [queryKey],
    queryFn,
    enabled,
    retry: false,
    staleTime: 10 * 60 * 1000,
    refetchInterval: (query) =>
      isPending(query.state.data) && query.state.dataUpdateCount < MAX_PENDING_CHECKS ? Math.max(3, query.state.data.retryAfter) * 1000 : false,
  });
  const waiting = isPending(data);
  const gaveUp = waiting && (client.getQueryState([queryKey])?.dataUpdateCount ?? 0) >= MAX_PENDING_CHECKS;
  return {
    data: waiting ? undefined : data,
    status: gaveUp ? Status.FAILURE : waiting ? Status.LOAD : mapQueryStatus(status, fetchStatus),
  };
}

/** The DeviantArt submission that shows a finished event collaboration, loaded when the page asks for it. A failed lookup is not retried */
export function useEventFinishedImage(params: GetEventsIdRequest, enabled: boolean) {
  const { data, status } = useSubmissionQuery<GetEventsIdFinishedImageResult>(
    ENDPOINTS.EVENT_FINISHED_IMAGE(params),
    eventFinishedImageFetcher(params),
    enabled
  );
  return { image: data, status };
}

/** The two texts at the top of every episode page */
export function useReservationInfo(initialData?: GetShowReservationInfoResult) {
  const { data } = useQuery({ queryKey: [ENDPOINTS.SHOW_RESERVATION_INFO], queryFn: reservationInfoFetcher(), initialData });
  return data;
}

/** The DeviantArt submission of a finished post, only looked up once `enabled` (the post is in view). A failed lookup is not retried */
export function usePostDeviation(params: { id: number }, enabled: boolean) {
  const { data, status } = useSubmissionQuery<GetPostsIdDeviationResult>(ENDPOINTS.POST_DEVIATION(params), postDeviationFetcher(params), enabled);
  return { deviation: data, status };
}
