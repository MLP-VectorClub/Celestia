import { isEmpty, mapValues, omit, omitBy } from 'lodash';

import { GuideName, PreviewAppearance, ShowListItem } from '@mlp-vectorclub/api-types';
import { FullGuideSortField, PublicUser } from 'src/types/api-alias';
import { Numeric } from 'src/types/common';
import { seasonEpisodeToString } from 'src/utils/show';
import { buildUrl, makeUrlSafe, pathSegmentWithId } from 'src/utils/url';

/**
 * List of frontend locations for easy reference / URL building
 */
export const PATHS = {
  ROOT: '/',
  ABOUT: '/about',
  ADMIN: '/admin',
  /** Appearances of the personal guides have no guide of their own, they live under their owner instead */
  APPEARANCE: ({ id, label, guide, ownerId }: Pick<PreviewAppearance, 'id' | 'label' | 'guide'> & { ownerId?: number | null }) =>
    guide === null && typeof ownerId === 'number'
      ? PATHS.PCG_APPEARANCE(ownerId, { id, label })
      : `/cg/${guide}/v/${pathSegmentWithId(id, label)}`,
  SHORT_APPEARANCE: ({ id, label }: Pick<PreviewAppearance, 'id' | 'label'>) => `/cg/v/${pathSegmentWithId(id, label)}`,
  BLENDING: '/blending',
  EVENTS: '/events',
  EVENT: ({ id, name }: { id: Numeric; name: string }) => `/event/${pathSegmentWithId(id, name)}`,
  GUIDE_INDEX: '/cg',
  GUIDE: (guide: GuideName, params?: { page?: string; q?: string }) => {
    let paramsCopy = params;
    if (params && params.page === '1') {
      paramsCopy = omit(params, 'page');
    }
    const queryParams = mapValues(
      omitBy(paramsCopy, (el) => typeof el !== 'string' || el.length === 0),
      String
    );
    const path = `/cg/${guide}`;
    if (isEmpty(queryParams)) return path;
    return buildUrl(path, queryParams);
  },
  GUIDE_FULL: (guide: GuideName, params?: { sort_by?: FullGuideSortField }) => {
    let paramsCopy = params;
    if (params && params.sort_by === 'relevance') {
      paramsCopy = omit(params, 'sort_by');
    }
    const queryParams = mapValues(
      omitBy(paramsCopy, (el) => typeof el === 'undefined'),
      String
    );
    const path = `/cg/${guide}/full`;
    if (isEmpty(queryParams)) return path;
    return buildUrl(path, queryParams);
  },
  GUIDE_CHANGES: (guide: GuideName, params?: { page?: string }) => {
    let paramsCopy = params;
    if (params && params.page === '1') {
      paramsCopy = omit(params, 'page');
    }
    const queryParams = mapValues(
      omitBy(paramsCopy, (el) => typeof el === 'undefined'),
      String
    );
    const path = `/cg/${guide}/changes`;
    if (isEmpty(queryParams)) return path;
    return buildUrl(path, queryParams);
  },
  GUIDE_TAGS: (guide: GuideName) => `/cg/${guide}/tags`,
  GUIDE_SPRITE: '/cg/sprite',
  LATEST_EPISODE: '/episode/latest',
  PRIVACY_POLICY: '/about/privacy',
  ABOUT_CONNECTION: '/about/connection',
  SHOW: '/show',
  USERS: '/users',
  USER_LEGACY: (username: string) => `/@${username}`,
  USER: (id: Numeric = '[user]') => `/users/${id}`,
  USER_CONTRIB: (id: Numeric, type: string) => `/users/${id}/contrib/${type}`,
  USER_PCG: (id: Numeric) => `/users/${id}/cg`,
  USER_PCG_POINT_HISTORY: (id: Numeric) => `/users/${id}/cg/point-history`,
  PCG_APPEARANCE: (ownerId: Numeric, { id, label }: Pick<PreviewAppearance, 'id' | 'label'>) =>
    `/users/${ownerId}/cg/v/${pathSegmentWithId(id, label)}`,
  USER_LONG: ({ id, name }: PublicUser) => `/users/${pathSegmentWithId(id, name)}`,
  /** Episodes are addressed by season and episode, everything else (movies, specials) by its ID */
  EPISODE: (show: Pick<ShowListItem, 'id' | 'season' | 'episode' | 'parts' | 'title'> & { type: string }) =>
    show.type === 'episode' && show.season !== null && show.episode !== null
      ? `/episode/${seasonEpisodeToString(show)}-${makeUrlSafe(show.title)}`
      : `/${show.type}/${pathSegmentWithId(show.id, show.title)}`,
};
