import { useQuery } from '@tanstack/react-query';
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

/** The DeviantArt submission that shows a finished event collaboration, loaded when the page asks for it. A failed lookup is not retried */
export function useEventFinishedImage(params: GetEventsIdRequest, enabled: boolean) {
  const { data, status, fetchStatus } = useQuery<GetEventsIdFinishedImageResult>({
    queryKey: [ENDPOINTS.EVENT_FINISHED_IMAGE(params)],
    queryFn: eventFinishedImageFetcher(params),
    enabled,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
  return { image: data, status: mapQueryStatus(status, fetchStatus) };
}

/** The two texts at the top of every episode page */
export function useReservationInfo(initialData?: GetShowReservationInfoResult) {
  const { data } = useQuery({ queryKey: [ENDPOINTS.SHOW_RESERVATION_INFO], queryFn: reservationInfoFetcher(), initialData });
  return data;
}

/** The DeviantArt submission of a finished post, only looked up once `enabled` (the post is in view). A failed lookup is not retried */
export function usePostDeviation(params: { id: number }, enabled: boolean) {
  const { data, status, fetchStatus } = useQuery<GetPostsIdDeviationResult>({
    queryKey: [ENDPOINTS.POST_DEVIATION(params)],
    queryFn: postDeviationFetcher(params),
    enabled,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
  return { deviation: data, status: mapQueryStatus(status, fetchStatus) };
}
