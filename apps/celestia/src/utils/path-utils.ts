import { GuideName } from '@mlp-vectorclub/api-types';
import { PATHS } from 'src/paths';
import { PublicUser, UserPrefs } from 'src/types/api-alias';
import { ProfileLinkOptions } from 'src/utils/profile';

// DO NOT ADD TO BARREL to avoid dependency cycle

export const getDefaultGuideLink = (prefs?: Partial<Pick<UserPrefs, 'cg_defaultguide'>>): string =>
  prefs?.cg_defaultguide ? PATHS.GUIDE(prefs.cg_defaultguide as GuideName) : PATHS.GUIDE_INDEX;

export const getHomeLink = (prefs?: Partial<Pick<UserPrefs, 'p_homelastep' | 'cg_defaultguide'>>): string =>
  prefs?.p_homelastep ? PATHS.LATEST_EPISODE : getDefaultGuideLink(prefs);

export const getProfileLink = (props: ProfileLinkOptions) => (props.name ? PATHS.USER_LONG(props as PublicUser) : PATHS.USER(props.id!));
