import {
  CutieMark,
  GetAboutConnectionResult,
  GetAppearancesFullRequest,
  GetAppearancesFullResult,
  GetShowIdResult,
  GetUsersMeResult,
  GetUsersResult,
  SlimGuideTag,
  User,
  UserRole,
} from '@mlp-vectorclub/api-types';
import { Nullable } from 'src/types/common';

export type MappedAboutConnectionResult = GetAboutConnectionResult & {
  commitDate: Nullable<Date>;
};

/**
 * Names the old (Luna) type package exported that the Winterchilla contract calls something else
 * (or does not name at all because the schema is inline)
 */
export type PublicUser = User;
export type BarePublicUser = GetUsersResult[number];
export type DatabaseRole = UserRole;
export type Role = UserRole;
export type FavMe = string;
export type TagType = NonNullable<SlimGuideTag['type']>;
export type CutieMarkFacing = CutieMark['facing'];
export type VectorApp = string;
export type { UserPrefs } from '@mlp-vectorclub/api-types';
export type CurrentUser = GetUsersMeResult['user'];
export type ShowEntry = GetShowIdResult['show'];
export type FullGuideSortField = NonNullable<GetAppearancesFullRequest['sort']>;
export type FullGuideAppearance = GetAppearancesFullResult['appearances'][number];
