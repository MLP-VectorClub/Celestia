import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';

import styles from 'modules/UserLinkWithAvatar.module.scss';
import { ResponsiveContainer } from 'src/components/shared/ResponsiveContainer';
import { PublicUser } from 'src/types/api-alias';
import { getProfileLink } from 'src/utils/path-utils';

const UserLinkWithAvatar: FC<PublicUser> = ({ id, name, avatarUrl }) => (
  <Link href={getProfileLink({ id, name })} className={`${styles.userLinkWithAvatar} ${styles.local}`}>
    {avatarUrl && (
      <div className={styles.avatar}>
        <ResponsiveContainer width={50} height={50}>
          <Image src={avatarUrl} alt={`avatar of ${name}`} fill />
        </ResponsiveContainer>
      </div>
    )}
    <span className={styles.name}>{name}</span>
  </Link>
);

export default UserLinkWithAvatar;
