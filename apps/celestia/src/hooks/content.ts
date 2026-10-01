import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  GetConfigResult,
  GetEventsIdRequest,
  GetEventsIdResult,
  GetEventsRequest,
  GetEventsResult,
  GetPostsRequest,
  GetPostsResult,
  GetShowIdRequest,
  GetShowIdResult,
  GetShowIdVoteRequest,
  GetShowIdVoteResult,
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
  eventsFetcher,
  personalGuideFetcher,
  pointHistoryFetcher,
  postsFetcher,
  profileFetcher,
  showFetcher,
  showVoteFetcher,
  tagsFetcher,
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
