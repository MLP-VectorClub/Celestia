import { Fade as Hamburger } from 'hamburger-react';
import { useTranslations } from 'next-intl';
import { FC, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { NavbarToggler } from 'reactstrap';

import { useAuth } from 'src/hooks';
import { useNotifications } from 'src/hooks/notifications';
import { RootState, useAppDispatch } from 'src/store';
import { coreActions } from 'src/store/slices';

const SidebarToggler: FC = () => {
  const t = useTranslations();
  const { sidebarOpen } = useSelector((state: RootState) => state.core);
  const dispatch = useAppDispatch();
  const { signedIn } = useAuth();
  const unread = useNotifications(signedIn).data?.length ?? 0;

  const toggleSidebar = () => dispatch(coreActions.toggleSidebar(!sidebarOpen));

  useEffect(() => {
    const sidebarClass = 'sidebar-open';
    if (sidebarOpen) document.body.classList.add(sidebarClass);
    else document.body.classList.remove(sidebarClass);
  }, [sidebarOpen]);

  return (
    <NavbarToggler id="sidebar-toggler" onClick={toggleSidebar}>
      <Hamburger toggled={sidebarOpen} color="currentColor" rounded />
      {signedIn && unread > 0 && (
        <span className="notif-cnt" title={t('common.sidebar.notificationCount')}>
          {unread}
        </span>
      )}
    </NavbarToggler>
  );
};

export default SidebarToggler;
