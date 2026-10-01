import { Nullable, Numeric, Translatable } from 'src/types';
import { PublicUser } from 'src/types/api-alias';

export const getProfileTitle = (user: Nullable<PublicUser> = null, authUserId: Nullable<number> = null): Translatable => {
  if (user) {
    if (authUserId === user.id) {
      return ['common.titles.yourProfile'];
    }
    if (user.name) {
      return ['common.titles.profileByName', { name: user.name }];
    }
  }
  return ['common.titles.profile'];
};

export type ProfileLinkOptions = {
  id: Nullable<Numeric>;
  name?: Nullable<string>;
};

/** Subpages of a profile (`/users/12-name/cg`) only need the ID that the first segment starts with */
export const parseUserIdParam = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const match = /^(\d+)(?:-.*)?$/.exec(value);
  return match ? Number(match[1]) : null;
};
