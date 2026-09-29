import { useTranslations } from 'next-intl';
import { FC } from 'react';

import StatusAlert from 'src/components/shared/StatusAlert';
import GroupedUserList from 'src/components/users/GroupedUserList';
import { useUsers } from 'src/hooks/users';

export const UserList: FC<{ enabled: boolean }> = ({ enabled }) => {
  const t = useTranslations();
  const { users, error, status } = useUsers(enabled);

  if (!users && !error) return null;

  return (
    <section>
      <h2>{t('users.userList.heading', { count: users ? users.length : 0 })}</h2>
      <StatusAlert status={status} subject={t('users.userList.loadingSubject')} />
      {users && <GroupedUserList users={users} />}
    </section>
  );
};
