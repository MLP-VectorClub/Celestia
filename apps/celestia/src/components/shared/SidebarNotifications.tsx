import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'src/store';

const SidebarNotifications: FC = () => {
  const t = useTranslations();
  const { notifications } = useSelector((state: RootState) => state.auth);
  return notifications.length > 0 ? (
    <section className="notifications">
      <>
        <h2>{t('common.sidebar.unreadNotifications')}</h2>
        {notifications}
      </>
    </section>
  ) : null;
};

export default SidebarNotifications;
