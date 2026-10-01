import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  GetConfigResult,
  GetEventsIdRequest,
  GetEventsIdResult,
  GetEventsRequest,
  GetEventsResult,
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
  profileFetcher,
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
