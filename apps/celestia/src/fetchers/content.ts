import { IncomingMessage } from 'http';

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
  GetShowLatestResult,
  GetShowRequest,
  GetShowReservationInfoResult,
  GetShowResult,
  GetShowUpcomingResult,
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
import { ResourceService } from 'src/services/resource';
import { ENDPOINTS, requestPromiseMapper } from 'src/utils';

const fetchResource = <T>(url: string, req?: IncomingMessage) => requestPromiseMapper(new ResourceService(req).get<T>(url));

/** The configuration is the same for every visitor, so the server keeps it for a while instead of asking for it on every render */
const CONFIG_TTL_MS = 10 * 60e3;
let configCache: { value: Promise<GetConfigResult>; expires: number } | null = null;

export const configFetcher = (req?: IncomingMessage) => () => {
  if (!req) return fetchResource<GetConfigResult>(ENDPOINTS.CONFIG);

  if (!configCache || configCache.expires < Date.now()) {
    const value = fetchResource<GetConfigResult>(ENDPOINTS.CONFIG);
    configCache = { value, expires: Date.now() + CONFIG_TTL_MS };
    // Do not keep a failure around
    value.catch(() => {
      if (configCache?.value === value) configCache = null;
    });
  }
  return configCache.value;
};

export const eventsFetcher = (params: GetEventsRequest, req?: IncomingMessage) => () =>
  fetchResource<GetEventsResult>(ENDPOINTS.EVENTS(params), req);

export const eventFetcher = (params: GetEventsIdRequest, req?: IncomingMessage) => () =>
  fetchResource<GetEventsIdResult>(ENDPOINTS.EVENT(params), req);

export const tagsFetcher = (params: GetTagsRequest, req?: IncomingMessage) => () =>
  fetchResource<GetTagsResult>(ENDPOINTS.TAGS(params), req);

export const profileFetcher = (params: GetUsersIdProfileRequest, req?: IncomingMessage) => () =>
  fetchResource<GetUsersIdProfileResult>(ENDPOINTS.USER_PROFILE(params), req);

export const contributionsFetcher = (params: GetUsersIdContributionsTypeRequest, req?: IncomingMessage) => () =>
  fetchResource<GetUsersIdContributionsTypeResult>(ENDPOINTS.USER_CONTRIBUTIONS(params), req);

export const personalGuideFetcher = (params: GetUsersIdPersonalGuideAppearancesRequest, req?: IncomingMessage) => () =>
  fetchResource<GetUsersIdPersonalGuideAppearancesResult>(ENDPOINTS.USER_PCG_APPEARANCES(params), req);

export const pointHistoryFetcher = (params: GetUsersIdPersonalGuidePointHistoryRequest, req?: IncomingMessage) => () =>
  fetchResource<GetUsersIdPersonalGuidePointHistoryResult>(ENDPOINTS.USER_PCG_POINT_HISTORY(params), req);

export const showFetcher = (params: GetShowIdRequest, req?: IncomingMessage) => () =>
  fetchResource<GetShowIdResult>(ENDPOINTS.SHOW_BY_ID(params), req);

export const latestShowFetcher = (req?: IncomingMessage) => () => fetchResource<GetShowLatestResult>(ENDPOINTS.SHOW_LATEST, req);

export const showVoteFetcher = (params: GetShowIdVoteRequest, req?: IncomingMessage) => () =>
  fetchResource<GetShowIdVoteResult>(ENDPOINTS.SHOW_VOTE(params), req);

export const showAdjacentFetcher = (params: GetShowIdRequest, req?: IncomingMessage) => () =>
  fetchResource<GetShowIdAdjacentResult>(ENDPOINTS.SHOW_ADJACENT(params), req);

export const reservationInfoFetcher = (req?: IncomingMessage) => () =>
  fetchResource<GetShowReservationInfoResult>(ENDPOINTS.SHOW_RESERVATION_INFO, req);

export const upcomingShowsFetcher = (req?: IncomingMessage) => () => fetchResource<GetShowUpcomingResult>(ENDPOINTS.SHOW_UPCOMING, req);

export const eventFinishedImageFetcher = (params: GetEventsIdRequest, req?: IncomingMessage) => () =>
  fetchResource<GetEventsIdFinishedImageResult>(ENDPOINTS.EVENT_FINISHED_IMAGE(params), req);

export const postDeviationFetcher = (params: { id: number }, req?: IncomingMessage) => () =>
  fetchResource<GetPostsIdDeviationResult>(ENDPOINTS.POST_DEVIATION(params), req);

export const postsFetcher = (params: GetPostsRequest, req?: IncomingMessage) => () =>
  fetchResource<GetPostsResult>(ENDPOINTS.POSTS(params), req);

export const showListLookupFetcher = (params: GetShowRequest, req?: IncomingMessage) => () =>
  fetchResource<GetShowResult>(ENDPOINTS.SHOW(params), req);

/**
 * Where a post lives. Winterchilla's contract describes `castle` as `{name, url}`, Luna sends `{name, showId, postId}` (the form Celestia needs, a
 * URL on the old site is of no use), so both are accepted here
 */
export interface PostLocation {
  castle?: { name?: string; showId?: number; postId?: number; url?: string };
}

export const postLocationFetcher = (params: { id: number }, req?: IncomingMessage) => () =>
  fetchResource<PostLocation>(ENDPOINTS.POST_LOCATION(params), req);
