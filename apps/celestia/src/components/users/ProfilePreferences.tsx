import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import { Button, Input } from 'reactstrap';

import { UserProfile } from '@mlp-vectorclub/api-types';
import styles from 'modules/ProfilePage.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { describeApiError, useApiMutation, useAuth, useUserPrefs } from 'src/hooks';
import { userPrefsKey } from 'src/hooks/prefs';
import { PATHS } from 'src/paths';
import { AccountService } from 'src/services/account';
import { ENDPOINTS } from 'src/utils';
import { UserPrefs } from 'src/types/api-alias';

type Key = keyof UserPrefs;
type Kind = 'checkbox' | 'number' | 'guide' | 'vectorapp';

interface Field {
  key: Key;
  kind: Kind;
  /** Only shown to staff */
  staffOnly?: boolean;
  /** Not shown to people who are on the club's Discord server */
  notDiscordMember?: boolean;
}

const SECTIONS: Array<{ id: 'cg' | 'ep' | 'personal' | 'limits'; fields: Field[]; staffSaves?: boolean }> = [
  {
    id: 'cg',
    fields: [
      { key: 'cg_defaultguide', kind: 'guide' },
      { key: 'cg_itemsperpage', kind: 'number' },
      { key: 'cg_hidesynon', kind: 'checkbox', staffOnly: true },
      { key: 'cg_hideclrinfo', kind: 'checkbox' },
      { key: 'cg_fulllstprev', kind: 'checkbox' },
      { key: 'cg_nutshell', kind: 'checkbox' },
    ],
  },
  { id: 'ep', fields: [{ key: 'ep_noappprev', kind: 'checkbox' }, { key: 'ep_revstepbtn', kind: 'checkbox' }] },
  {
    id: 'personal',
    fields: [
      { key: 'p_vectorapp', kind: 'vectorapp' },
      { key: 'p_hidediscord', kind: 'checkbox', notDiscordMember: true },
      { key: 'p_hidepcg', kind: 'checkbox' },
      { key: 'p_homelastep', kind: 'checkbox' },
    ],
  },
  {
    id: 'limits',
    staffSaves: true,
    fields: (['a_pcgearn', 'a_pcgmake', 'a_pcgsprite', 'a_postreq', 'a_postres', 'a_reserve'] as Key[]).map((key) => ({ key, kind: 'checkbox' as const })),
  },
];

const VECTOR_APPS = ['', 'illustrator', 'inkscape', 'ponyscape'];

type Value = boolean | number | string | null;

/** One preference as the old site showed it: its sentence with the input in it and a green Save button that only enables after a change */
const PrefForm: FC<{ field: Field; userId: number; stored: Value; canSave: boolean }> = ({ field, userId, stored, canSave }) => {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const initial = (): Value => (field.kind === 'checkbox' ? Boolean(stored) : field.kind === 'number' ? Number(stored ?? 7) : (stored ?? '') as string);
  const [value, setValue] = useState<Value>(initial);
  useEffect(() => setValue(initial()), [stored]); // eslint-disable-line react-hooks/exhaustive-deps
  const { user } = useAuth();
  const save = useApiMutation(() => AccountService.setPreference(userId, field.key, (value === '' ? null : value) as never), {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [userPrefsKey(userId)] });
      if (user.id === userId) void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.USER_PREFS_ME()] });
      // What a few of them change shows in the profile and the sidebar right away
      if (['p_vectorapp', 'p_hidepcg'].includes(field.key)) void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.USER_PROFILE({ id: userId })] });
    },
  });
  const changed = value !== initial();
  const id = `pref-${field.key}`;
  const label = (
    <>
      {field.key === 'p_homelastep' && <InlineIcon icon="home" first />}
      {t(`users.prefs.${field.key}`)}
    </>
  );

  const input =
    field.kind === 'checkbox' ? (
      <Input id={id} type="checkbox" checked={Boolean(value)} disabled={!canSave} onChange={(e) => setValue(e.target.checked)} />
    ) : field.kind === 'number' ? (
      <Input id={id} type="number" min={7} max={20} step={1} style={{ width: '5rem' }} value={String(value)} disabled={!canSave} onChange={(e) => setValue(Number(e.target.value))} />
    ) : field.kind === 'guide' ? (
      <Input id={id} type="select" style={{ width: 'auto' }} value={String(value)} disabled={!canSave} onChange={(e) => setValue(e.target.value)}>
        <option value="">{t('users.prefs.cg_defaultguideNone')}</option>
        <optgroup label={t('users.prefs.guides')}>
          <option value="pony">Friendship is Magic</option>
          <option value="eqg">Equestria Girls</option>
        </optgroup>
      </Input>
    ) : (
      <Input id={id} type="select" style={{ width: 'auto' }} value={String(value)} disabled={!canSave} onChange={(e) => setValue(e.target.value)}>
        {VECTOR_APPS.map((app) => (
          <option key={app} value={app}>
            {app === '' ? t('users.prefs.p_vectorappNone') : app === 'illustrator' ? 'Adobe Illustrator' : app === 'inkscape' ? 'Inkscape' : 'Ponyscape'}
          </option>
        ))}
      </Input>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (changed && canSave) save.mutate();
      }}
    >
      <label htmlFor={id}>
        {field.kind === 'checkbox' ? (
          <>
            {input} <span>{label}</span>
          </>
        ) : (
          <>
            <span>{label}</span> {input}
          </>
        )}
        {canSave && (
          <Button color="success" size="sm" className="save" disabled={!changed || save.isPending}>
            {t('users.profile.save')}
          </Button>
        )}
      </label>
      {save.error && <div className="text-danger small">{describeApiError(save.error)}</div>}
    </form>
  );
};

/** The preferences of the profile owner, visible to them and to staff, laid out like the old site's profile page */
export const ProfilePreferences: FC<{ profile: UserProfile }> = ({ profile }) => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const userId = profile.user.id;
  const prefs = useUserPrefs(userId, profile.sameUser || isStaff);
  if (!profile.sameUser && !isStaff) return null;

  return (
    <div id="settings" className={styles.settings}>
      <h2>{t('users.profile.preferences')}</h2>
      {SECTIONS.map((section) => {
        const fields = section.fields.filter((f) => (!f.staffOnly || isStaff) && (!f.notDiscordMember || !profile.discordServerMember));
        return (
          <section key={section.id} className={`${section.id}-settings`}>
            <h3>
              {profile.sameUser && (
                <span className={styles.privacy} title={t('users.profile.visibleTo.staff')}>
                  <InlineIcon icon="lock" />
                </span>
              )}
              {t(`users.profile.sections.${section.id}`)}
            </h3>
            {prefs ? (
              fields.map((field) => (
                <PrefForm key={field.key} field={field} userId={userId} stored={prefs[field.key] as Value} canSave={section.staffSaves ? isStaff : profile.sameUser} />
              ))
            ) : (
              <p className="text-muted">{t('users.staffTools.loading')}</p>
            )}
          </section>
        );
      })}
      <section className="account-settings">
        <h3>{t('users.profile.sections.account')}</h3>
        <p>{t('users.profile.accountMoved')}</p>
        <Button tag={Link} href={PATHS.USER_ACCOUNT(userId)} color="guide-link" size="lg">
          <InlineIcon icon="arrow-right" first />
          {t('users.profile.goToAccount')}
        </Button>
      </section>
    </div>
  );
};
