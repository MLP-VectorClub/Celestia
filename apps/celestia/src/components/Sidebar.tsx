import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Button } from 'reactstrap';

import ExternalLink from 'src/components/shared/ExternalLink';
import InlineIcon from 'src/components/shared/InlineIcon';
import MainNavigation from 'src/components/shared/MainNavigation';
import SidebarNotifications from 'src/components/shared/SidebarNotifications';
import SidebarUsefulLinks from 'src/components/shared/SidebarUsefulLinks';
import SidebarUserInfo from 'src/components/shared/SidebarUserInfo';
import SignInButton from 'src/components/shared/SignInButton';
import SignOutButton from 'src/components/shared/SignOutButton';
import HappeningSoon from 'src/components/widgets/HappeningSoon';
import { DISCORD_INVITE_LINK } from 'src/config';
import { useAuth, useConnectionInfo, useSidebarWidgetSlot } from 'src/hooks';

const Sidebar: FC = () => {
  const t = useTranslations();
  const { signedIn } = useAuth();
  const { backendDown } = useConnectionInfo();
  const widget = useSidebarWidgetSlot();

  return (
    <aside id="sidebar">
      <div className="mobile-nav d-block d-lg-none">
        <MainNavigation />
      </div>

      <SidebarUserInfo />

      {backendDown && (
        <section className="signin">
          <h2>{t('common.sidebar.welcome')}</h2>
          <p>{t('common.sidebar.backendDown')}</p>
        </section>
      )}
      {!backendDown && (
        <>
          {signedIn && <SidebarNotifications />}

          <section className={signedIn ? 'welcome' : 'signin'}>
            <SidebarUsefulLinks />
            <div className="mb-2">{signedIn ? <SignOutButton /> : <SignInButton />}</div>
            <Button color="discord" size="sm" tag={ExternalLink} href={DISCORD_INVITE_LINK}>
              <InlineIcon icon={['fab', 'discord']} first />
              {t('common.sidebar.joinDiscord')}
            </Button>
          </section>
          {widget}
          <HappeningSoon />
        </>
      )}
    </aside>
  );
};

export default Sidebar;
