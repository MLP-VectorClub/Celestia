import { IncomingMessage } from 'http';

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
