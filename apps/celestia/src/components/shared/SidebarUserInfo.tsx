import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';

import AvatarWrap from 'src/components/shared/AvatarWrap';
import LoadingRing from 'src/components/shared/LoadingRing';
import ProfileLink from 'src/components/shared/ProfileLink';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { useAuth, usePrefs } from 'src/hooks';
import { Status } from 'src/types';
import { mapRoleLabel } from 'src/utils';

const SidebarUserInfo: FC = () => {
  const t = useTranslations();
  const { authCheck, user, signedIn, refreshing, sessionEnded } = useAuth();
  const prefs = usePrefs(signedIn);
  const { confirm } = useDialog();

  // Like the old site's "updating session" state, but only when the refresh takes noticeable time
  const [slowRefresh, setSlowRefresh] = useState(false);
  useEffect(() => {
    if (!refreshing) {
      setSlowRefresh(false);
      return;
    }
    const timer = setTimeout(() => setSlowRefresh(true), 500);
    return () => clearTimeout(timer);
  }, [refreshing]);

  useEffect(() => {
    if (sessionEnded)
      void confirm({ title: t('common.sessionEnded.title'), body: t('common.sessionEnded.body'), confirmLabel: t('common.actions.close') });
  }, [sessionEnded, confirm, t]);

  const checkingAuth = authCheck.status === Status.LOAD;
  const updatingSession = slowRefresh && !checkingAuth;

  return (
    <div
      className={classNames(`logged-in provider-${user.avatarProvider}`, {
        'checking-auth': checkingAuth || updatingSession,
      })}
      title={checkingAuth ? t('common.sidebar.authCheck') : updatingSession ? t('common.sidebar.sessionUpdating') : undefined}
    >
      <LoadingRing color="white" outline={false} className="spinner" />
      <AvatarWrap avatarProvider={user.avatarProvider} avatarUrl={user.avatarUrl} vectorApp={prefs?.p_vectorapp || null} size={50} />
      <div className="user-data">
        <span className="user-name">{signedIn ? <ProfileLink {...user} /> : t('common.guestUserName')}</span>
        <span className="user-role">
          <span>{mapRoleLabel(t, user.role)}</span>
        </span>
      </div>
    </div>
  );
};

export default SidebarUserInfo;
