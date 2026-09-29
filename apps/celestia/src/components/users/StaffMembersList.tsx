import { FC } from 'react';

import { PublicUser } from '@mlp-vectorclub/api-types';
import styles from 'modules/StaffMembersList.module.scss';
import UserLinkWithAvatar from 'src/components/shared/UserLinkWithAvatar';

const StaffMembersList: FC<{ members: PublicUser[] }> = ({ members }) => (
  <div className={styles.staffBlock}>
    {members.map((m) => (
      <UserLinkWithAvatar key={m.id} {...m} />
    ))}
  </div>
);

export default StaffMembersList;
