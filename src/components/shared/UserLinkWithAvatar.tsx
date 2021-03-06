import Link from 'next/link';
import { PublicUser } from 'src/types';
import styles from 'modules/UserLinkWithAvatar.module.scss';
import { getProfileLink } from 'src/utils/path-utils';
import { VFC } from 'react';
import Image from 'next/image';

const UserLinkWithAvatar: VFC<PublicUser> = ({ id, name, avatarUrl }) => (
  <Link href={getProfileLink({ id, name })}>
    <a className={`${styles.userLinkWithAvatar} ${styles.local}`}>
      {avatarUrl && (
        <div className={styles.avatar}>
          <Image src={avatarUrl} alt={`avatar of ${name}`} layout="intrinsic" width={50} height={50} />
        </div>
      )}
      <span className={styles.name}>{name}</span>
    </a>
  </Link>
);

export default UserLinkWithAvatar;
