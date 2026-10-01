import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';

import { UserProfile } from '@mlp-vectorclub/api-types';
import { AppearancePreview } from 'src/components/colorguide/AppearancePreview';
import { PostLine } from 'src/components/users/PostLine';
import { PATHS } from 'src/paths';

type PropTypes = { profile: UserProfile };

export const ProfileContributions: FC<PropTypes> = ({ profile }) => {
  const t = useTranslations();
  if (profile.contributions.length === 0) return null;
  return (
    <section>
      <h2>{t('users.profile.contributions')}</h2>
      <ul>
        {profile.contributions.map((c) => (
          <li key={c.type}>
            <Link href={PATHS.USER_CONTRIB(profile.user.id, c.type)}>
              {c.count} {c.noun}
            </Link>{' '}
            <small className="text-muted">{c.verb}</small>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const ProfilePersonalGuides: FC<PropTypes> = ({ profile }) => {
  const t = useTranslations();
  return (
    <section>
      <h2>
        <Link href={PATHS.USER_PCG(profile.user.id)}>{t('users.profile.personalGuide')}</Link>
      </h2>
      {profile.personalGuides === null && <p className="text-muted">{t('users.profile.personalGuidePrivate')}</p>}
      {profile.personalGuides?.length === 0 && <p className="text-muted">{t('users.profile.noPersonalGuide')}</p>}
      <div className="d-flex flex-wrap">
        {profile.personalGuides?.map((a) => (
          <Link key={a.id} href={PATHS.PCG_APPEARANCE(profile.user.id, a)} className="me-3 mb-2 text-center" style={{ width: 96 }}>
            <div className="mx-auto mb-1" style={{ width: 64, height: 64 }}>
              <AppearancePreview data={a.previewData} className="w-100 h-100" />
            </div>
            <small>{a.private ? t('users.profile.private') : a.label}</small>
          </Link>
        ))}
      </div>
    </section>
  );
};

export const ProfileAwaitingApproval: FC<PropTypes> = ({ profile }) => {
  const t = useTranslations();
  if (!profile.awaitingApproval || profile.awaitingApproval.length === 0) return null;
  return (
    <section>
      <h2>{t('users.profile.awaitingApproval')}</h2>
      {profile.awaitingApproval.map((post) => (
        <PostLine key={post.id} post={post} />
      ))}
    </section>
  );
};
