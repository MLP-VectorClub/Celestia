import {
  CutieMark,
  GetAboutConnectionResult,
  GetAppearancesFullResult,
  GetAppearancesResult,
  GetUsersMeResult,
  GetUsersResult,
  Pagination,
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
export type CurrentUser = GetUsersMeResult['user'];
export type FullGuideSortField = 'label' | 'relevance' | 'added';
export type FullGuideAppearance = GetAppearancesFullResult['appearances'][number];

/**
 * Keys of `GET /user-prefs/me`. The contract only says "preference key to value", so this is taken from
 * Winterchilla's `UserPrefs::DEFAULTS` (Winterchilla `app/UserPrefs.php`)
 */
export interface UserPrefs {
  cg_itemsperpage: number;
  cg_hidesynon: number;
  cg_hideclrinfo: number;
  cg_fulllstprev: number;
  cg_nutshell: number;
  cg_defaultguide: Nullable<string>;
  p_vectorapp: string;
  p_hidediscord: number;
  p_hidepcg: number;
  p_homelastep: number;
  ep_noappprev: number;
  ep_revstepbtn: number;
  a_pcgearn: number;
  a_pcgmake: number;
  a_pcgsprite: number;
  a_postreq: number;
  a_postres: number;
  a_reserve: number;
}

/**
 * TEMPORARY: `GET /appearances` returns `pagination` but the regenerated schema (Winterchilla 1073e4fb) dropped it from `AppearanceList`;
 * reported to the Winterchilla session. Remove once the schema has it again.
 */
export type PagedAppearancesResult = GetAppearancesResult & { pagination: Pagination };
