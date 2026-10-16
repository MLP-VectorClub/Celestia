import {
  GetAppearancesAutocompleteRequest,
  GetAppearancesFullRequest,
  GetAppearancesIdLocateRequest,
  GetAppearancesIdRequest,
  GetAppearancesIdSpriteRequest,
  GetAppearancesPinnedRequest,
  GetAppearancesRequest,
  GetColorGuideMajorChangesRequest,
  GetEventsIdRequest,
  GetEventsRequest,
  GetPostsRequest,
  GetShowIdRequest,
  GetShowIdVoteRequest,
  GetShowRequest,
  GetTagsRequest,
  GetUserPrefsMeRequest,
  GetUsersDaUsernameRequest,
  GetUsersIdContributionsTypeRequest,
  GetUsersIdPersonalGuideAppearancesRequest,
  GetUsersIdPersonalGuidePointHistoryRequest,
  GetUsersIdProfileRequest,
  GetUsersIdRequest,
} from '@went.tf/mlp-vectorclub-api-types';

import { GetUsersOauthSigninProviderRequest } from 'src/types/auth';
import { buildUrl } from 'src/utils/url';

export const ENDPOINTS = {
  SLEEP: `/about/sleep`,
  CONNECTION_INFO: `/about/connection`,
  MEMBERS: `/about/members`,
  CSRF_INIT: `/sanctum/csrf-cookie`,
  USER_PREFS_ME: (data?: GetUserPrefsMeRequest) => buildUrl(`/user-prefs/me`, data),
  USERS: `/users`,
  USERS_SIGNIN: `/users/signin`,
  USERS_SIGNIN_TWO_FACTOR: `/users/signin/two-factor`,
  USERS_SIGNIN_TWO_FACTOR_PASSKEY_OPTIONS: `/users/signin/two-factor/passkey/options`,
  USERS_SIGNIN_TWO_FACTOR_PASSKEY: `/users/signin/two-factor/passkey`,
  USERS_SIGNIN_PASSKEY_OPTIONS: `/users/signin/passkey/options`,
  USERS_SIGNIN_PASSKEY: `/users/signin/passkey`,
  USERS_PASSWORD_FORGOT: `/users/password/forgot`,
  USERS_PASSWORD_RESET: `/users/password/reset`,
  USERS_SIGNOUT: `/users/signout`,
  USERS_ME: `/users/me`,
  USERS_TOKENS: `/users/tokens`,
  USERS_BY_ID: (params: GetUsersIdRequest) => `/users/${params.id}`,
  USERS_OAUTH_SIGNIN_PROVIDER: (params: GetUsersOauthSigninProviderRequest) => `/users/oauth/signin/${params.provider}`,
  // USERS_OAUTH_SIGNUP_PROVIDER: (params: GetUsersOauthSignupProviderRequest) =>
  //   `/users/oauth/signup/${params.provider}`,
  USERS_BY_USERNAME: (params: GetUsersDaUsernameRequest) => `/users/da/${encodeURI(params.username)}`,
  GUIDE_INDEX: `/color-guide`,
  GUIDE_MAJOR_CHANGES: (params: GetColorGuideMajorChangesRequest) => buildUrl(`/color-guide/major-changes`, params),
  APPEARANCE: (params: GetAppearancesIdRequest & { token?: string }) =>
    buildUrl(`/appearances/${params.id}`, params.token ? { token: params.token } : undefined),
  APPEARANCES: (params: GetAppearancesRequest) => buildUrl(`/appearances`, params),
  APPEARANCES_FULL: (params: GetAppearancesFullRequest) => buildUrl(`/appearances/full`, params),
  APPEARANCE_SPRITE: (params: GetAppearancesIdSpriteRequest) => buildUrl(`/appearances/${params.id}/sprite`, params),
  APPEARANCE_SPRITE_COLORS: ({ id, token }: { id: number; token?: string }) =>
    buildUrl(`/appearances/${id}/sprite/colors`, token ? { token } : undefined),
  APPEARANCE_LOCATE: (data: GetAppearancesIdLocateRequest) => buildUrl(`/appearances/${data.id}/locate`),
  APPEARANCES_PINNED: (params: GetAppearancesPinnedRequest) => buildUrl(`/appearances/pinned`, params),
  APPEARANCES_AUTOCOMPLETE: (params: GetAppearancesAutocompleteRequest) => buildUrl(`/appearances/autocomplete`, params),
  /*
  APPEARANCE_PALETTE: (appearanceId: number) =>
    buildUrl('', {
      path: `/appearances/${appearanceId}/palette`,
      // TODO hash
    }),
  */
  USEFUL_LINKS_SIDEBAR: `/useful-links/sidebar`,
  SHOW: (params: GetShowRequest) => buildUrl(`/show`, params),
  CONFIG: `/config`,
  SHOW_BY_ID: ({ id }: GetShowIdRequest) => `/show/${id}`,
  SHOW_LATEST: `/show/latest`,
  SHOW_VOTE: ({ id }: GetShowIdVoteRequest) => `/show/${id}/vote`,
  SHOW_UPCOMING: '/show/upcoming',
  SHOW_ADJACENT: ({ id }: GetShowIdRequest) => `/show/${id}/adjacent`,
  SHOW_RESERVATION_INFO: `/show/reservation-info`,
  POSTS: (params: GetPostsRequest) => buildUrl(`/posts`, params),
  POST_LOCATION: ({ id }: { id: number }) => `/posts/${id}/location`,
  POST_LEGACY_ID: (params: { kind: 'request' | 'reservation'; oldId: number }) => `/posts/legacy/${params.kind}/${params.oldId}`,
  POST_DEVIATION: ({ id }: { id: number }) => `/posts/${id}/deviation`,
  EVENTS: (params?: GetEventsRequest) => buildUrl(`/events`, params),
  EVENT: ({ id }: GetEventsIdRequest) => `/events/${id}`,
  EVENT_FINISHED_IMAGE: ({ id }: GetEventsIdRequest) => `/events/${id}/finished-image`,
  TAGS: (params?: GetTagsRequest) => buildUrl(`/tags`, params),
  USER_PROFILE: ({ id }: GetUsersIdProfileRequest) => `/users/${id}/profile`,
  USER_CONTRIBUTIONS: ({ id, type, ...params }: GetUsersIdContributionsTypeRequest) =>
    buildUrl(`/users/${id}/contributions/${type}`, params),
  USER_PCG_APPEARANCES: ({ id, ...params }: GetUsersIdPersonalGuideAppearancesRequest) =>
    buildUrl(`/users/${id}/personal-guide/appearances`, params),
  USER_PCG_POINT_HISTORY: ({ id, ...params }: GetUsersIdPersonalGuidePointHistoryRequest) =>
    buildUrl(`/users/${id}/personal-guide/point-history`, params),
};
