import classNames from 'classnames';
import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';

import styles from 'modules/UserLinkWithAvatar.module.scss';
import { ResponsiveContainer } from 'src/components/shared/ResponsiveContainer';
import { PublicUser } from 'src/types/api-alias';
import { getProfileLink } from 'src/utils/path-utils';

interface ReserverProps {
  /** The taller pill the old site showed the reserver of a post in, with a small caption above the name ("Reserved by:") */
  caption: string;
  /** The vector app the user makes their vectors with: tints the pill and puts the app's icon over the avatar */
  vectorApp?: string | null;
  /** Shown when hovering the pill (which app it is) */
  title?: string;
}

const UserLinkWithAvatar: FC<Pick<PublicUser, 'id' | 'name' | 'avatarUrl'> & Partial<ReserverProps>> = ({
  id,
  name,
  avatarUrl,
  caption,
  vectorApp,
  title,
}) => {
  const link = (
    <Link
      href={getProfileLink({ id, name })}
      className={classNames(styles.userLinkWithAvatar, caption ? [styles.tall, 'da-userlink'] : styles.local)}
    >
      {avatarUrl && (
        <div className={classNames(styles.avatar, 'avatar')}>
          <ResponsiveContainer width={50} height={50}>
            <Image src={avatarUrl} alt={`avatar of ${name}`} fill />
          </ResponsiveContainer>
        </div>
      )}
      {caption ? (
        <span className={styles.text}>
          <span className={styles.caption}>{caption}</span>
          <span className={styles.name}>{name}</span>
        </span>
      ) : (
        <span className={styles.name}>{name}</span>
      )}
    </Link>
  );

  // The vector app styles hang on a wrapper with these class names, like on the old site (see `vapp` in the global styles)
  return caption ? (
    <div className={classNames('reserver', styles.reserver, vectorApp && `app-${vectorApp}`)} title={title}>
      {link}
    </div>
  ) : (
    link
  );
};

export default UserLinkWithAvatar;
