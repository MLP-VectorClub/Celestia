import BuildUrl from 'build-url';
import md5 from 'md5';
import { GUEST_AVATAR } from '../config';
import { Nullable, Numeric } from '../types';

interface GetAvatarOptions {
  email: Nullable<string>;
  emailHash?: Nullable<string>;
  size: Numeric;
}

export const getAvatar = ({ email, emailHash, size }: GetAvatarOptions) => {
  let hash = emailHash;
  if (!hash) {
    if (email === null) return GUEST_AVATAR;

    hash = md5(email);
  }


  return BuildUrl(`https://s.gravatar.com/avatar/${hash}`, {
    queryParams: {
      s: String(size),
    },
  });
};
