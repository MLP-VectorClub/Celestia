import classNames from 'classnames';
import Image from 'next/image';
import { FC, memo } from 'react';

import { AvatarProvider } from '@mlp-vectorclub/api-types';
import { GUEST_AVATAR } from 'src/config';
import { Nullable } from 'src/types';
import { VectorApp } from 'src/types/api-alias';

interface PropTypes {
  avatarUrl: Nullable<string>;
  avatarProvider: AvatarProvider;
  // email?: Nullable<string>;
  // emailHash?: Nullable<string>;
  size: number;
  className?: string;
  vectorApp?: VectorApp | null;
}

const AvatarWrap: FC<PropTypes> = ({ avatarProvider, avatarUrl, size, className, vectorApp = null }) => (
  <div className={classNames(`avatar-wrap provider-${avatarProvider}`, className, vectorApp && `app-${vectorApp}`)}>
    <Image src={avatarUrl || GUEST_AVATAR} className="avatar" width={size} height={size} unoptimized priority alt="Avatar image" />
  </div>
);

export default memo(AvatarWrap);
