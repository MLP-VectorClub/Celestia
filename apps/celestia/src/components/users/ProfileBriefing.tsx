import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Button } from 'reactstrap';

import { UserProfile } from '@mlp-vectorclub/api-types';
import styles from 'modules/ProfilePage.module.scss';
import AvatarWrap from 'src/components/shared/AvatarWrap';
import InlineIcon from 'src/components/shared/InlineIcon';
import { ChangeRoleDialog } from 'src/components/users/ChangeRoleDialog';
import { mapRoleLabel } from 'src/utils';

const VECTOR_APP_NAMES: Record<string, string> = { illustrator: 'Adobe Illustrator', inkscape: 'Inkscape', ponyscape: 'Ponyscape' };

/** The DeviantArt "D", drawn in the site's green like on the old site */
const DeviantArtLogo: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 167" aria-hidden>
    <path d="M100 0 L99.96 0 L99.95 0 L71.32 0 L68.26 3.04 L53.67 30.89 L49.41 33.35 L0 33.35 L0 74.97 L26.40 74.97 L29.15 77.72 L0 133.36 L0 166.5 L0 166.61 L0 166.61 L28.70 166.6 L31.77 163.55 L46.39 135.69 L50.56 133.28 L100 133.28 L100 91.68 L73.52 91.68 L70.84 89 L100 33.33" />
  </svg>
);

/** The top of a profile: avatar, name with the links and logos behind it, role (and the button to change it) */
export const ProfileBriefing: FC<{ profile: UserProfile }> = ({ profile }) => {
  const t = useTranslations();
  const [changingRole, setChangingRole] = useState(false);
  const { user } = profile;
  const vectorApp = profile.vectorApp ?? null;

  return (
    <div className={styles.briefing}>
      <div style={{ flex: '0 0 auto', width: 80 }}>
        <AvatarWrap avatarUrl={user.avatarUrl} avatarProvider={user.avatarProvider} size={80} vectorApp={null} />
      </div>
      <div className={styles.title}>
        <h1>
          <span className="username">{user.name}</span>
          {profile.deviantArtUrl && (
            <a className={styles.da} href={profile.deviantArtUrl} title={t('users.profile.visitDa')} target="_blank" rel="noopener noreferrer">
              <DeviantArtLogo />
            </a>
          )}
          {vectorApp && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.vectorAppLogo}
              src={`/img/vapps/${vectorApp}.svg`}
              alt={t('users.profile.vectorAppTitle', { app: VECTOR_APP_NAMES[vectorApp] ?? vectorApp })}
              title={t('users.profile.vectorAppTitle', { app: VECTOR_APP_NAMES[vectorApp] ?? vectorApp })}
            />
          )}
          {profile.discordServerMember && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.discordLogo}
              src="/img/discord-logo.svg"
              alt="Discord logo"
              title={
                profile.discordName && profile.discordName !== user.name
                  ? t('users.profile.discordMemberAs', { name: profile.discordName })
                  : t('users.profile.discordMemberTitle')
              }
            />
          )}
        </h1>
        <p>
          <span className="role-label">{mapRoleLabel(t, user.role)}</span>
          {profile.canEdit && profile.editableRoles && Object.keys(profile.editableRoles).length > 0 && (
            <>
              {' '}
              <Button
                color="blue"
                size="sm"
                id="change-role"
                title={t('users.profile.changeRoleTitle', { name: user.name })}
                aria-label={t('users.profile.changeRoleTitle', { name: user.name })}
                onClick={() => setChangingRole(true)}
              >
                <InlineIcon icon="wrench" />
              </Button>
              <ChangeRoleDialog profile={profile} isOpen={changingRole} onClose={() => setChangingRole(false)} />
            </>
          )}
          {profile.developerInfo && (
            <>
              {profile.developerInfo.deviantArtId && (
                <>
                  {' '}
                  • <span className={styles.ids}>{profile.developerInfo.deviantArtId}</span>
                </>
              )}
              {profile.developerInfo.discordId && (
                <>
                  {' '}
                  • <span className={styles.ids}>{profile.developerInfo.discordId}</span>
                </>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  );
};
