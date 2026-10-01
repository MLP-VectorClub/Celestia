import { FC } from 'react';

import styles from 'modules/StaffMembersList.module.scss';
import UserLinkWithAvatar from 'src/components/shared/UserLinkWithAvatar';
import { PublicUser } from 'src/types/api-alias';

const StaffMembersList: FC<{ members: PublicUser[] }> = ({ members }) => (
  <div className={styles.staffBlock}>
    {members.map((m) => (
      <UserLinkWithAvatar key={m.id} {...m} />
    ))}
  </div>
);

export default StaffMembersList;
