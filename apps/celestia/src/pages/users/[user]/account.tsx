import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';
import { Alert, Button, FormGroup, Input, Label } from 'reactstrap';

import { GetUsersIdResult } from '@mlp-vectorclub/api-types';
import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { PasswordForm } from 'src/components/users/PasswordForm';
import { userFetcher } from 'src/fetchers';
import { describeApiError, useApiMutation, useAuth, useConfig, usePrefs, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { AccountService } from 'src/services/account';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { UserPrefs } from 'src/types/api-alias';
import { TitleFactory } from 'src/types/title';
import { ENDPOINTS, handleDataFetchingError, notFound, permission } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { parseUserIdParam } from 'src/utils/profile';

type FlagKey = {
  [K in keyof UserPrefs]-?: NonNullable<UserPrefs[K]> extends boolean ? K : never;
}[keyof UserPrefs];

const SITE_FLAGS: FlagKey[] = ['p_homelastep', 'p_hidediscord', 'p_hidepcg', 'ep_noappprev', 'ep_revstepbtn'];
const GUIDE_FLAGS: FlagKey[] = ['cg_hidesynon', 'cg_hideclrinfo', 'cg_fulllstprev', 'cg_nutshell'];
const STAFF_FLAGS: FlagKey[] = ['a_pcgearn', 'a_pcgmake', 'a_pcgsprite', 'a_postreq', 'a_postres', 'a_reserve'];

interface PropTypes {
  userId: number;
  user: Nullable<GetUsersIdResult>;
}

const titleFactory: TitleFactory<Pick<PropTypes, 'user'>> = ({ user }) => ({
  title: ['common.titles.account'],
  breadcrumbs: [
    { label: ['users.profile.breadcrumb'] },
    ...(user ? [{ label: user.name, linkProps: { href: PATHS.USER_LONG(user) } }] : []),
    { label: ['users.account.breadcrumb'], active: true },
  ],
});

const AccountPage: NextPage<PropTypes> = ({ userId, user }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { confirm } = useDialog();
  const { user: authUser, signedIn, isStaff } = useAuth();
  const prefs = usePrefs(signedIn);
  const { config } = useConfig();

  const titleData = useMemo(() => titleFactory({ user }), [user]);
  useTitleSetter(dispatch, titleData);

  const setPref = useApiMutation(
    ({ key, value }: { key: keyof UserPrefs; value: UserPrefs[keyof UserPrefs] }) =>
      AccountService.setPreference(userId, key, value as never),
    {
      invalidate: [[ENDPOINTS.USER_PREFS_ME()]],
    }
  );
  const signOutEverywhere = useApiMutation(() => AccountService.signOutEverywhere(), {
    invalidate: [[ENDPOINTS.USERS_ME]],
  });
  const syncDiscord = useApiMutation(() => AccountService.syncDiscord(userId));
  const unlinkDiscord = useApiMutation(() => AccountService.unlinkDiscord(userId));

  const heading = (
    <StandardHeading heading={t('users.account.heading')} lead={user ? t('users.account.lead', { name: user.name }) : undefined} />
  );

  if (!signedIn) {
    return (
      <Content>
        {heading}
        <Alert color="ui" fade={false}>
          {t('users.account.signInRequired')}
        </Alert>
      </Content>
    );
  }

  if (authUser.id !== userId) {
    return (
      <Content>
        {heading}
        <Alert color="warning" fade={false}>
          {t('users.account.notYours')}
        </Alert>
      </Content>
    );
  }

  const flag = (key: FlagKey) => (
    <FormGroup switch key={key}>
      <Input
        type="switch"
        id={`pref-${key}`}
        role="switch"
        checked={Boolean(prefs?.[key])}
        disabled={!prefs || setPref.isPending}
        onChange={(e) => setPref.mutate({ key, value: e.target.checked })}
      />
      <Label for={`pref-${key}`} check>
        {t(`users.account.prefs.${key}`)}
      </Label>
    </FormGroup>
  );

  const error = [setPref, signOutEverywhere, syncDiscord, unlinkDiscord].find((m) => m.error)?.error;

  return (
    <Content>
      {heading}
      {error && (
        <Alert color="danger" fade={false} role="alert">
          {describeApiError(error)}
        </Alert>
      )}

      <section>
        <h2>{t('users.account.sections.colorGuide')}</h2>
        <FormGroup>
          <Label for="pref-cg_itemsperpage">{t('users.account.prefs.cg_itemsperpage')}</Label>
          <Input
            id="pref-cg_itemsperpage"
            type="select"
            value={prefs?.cg_itemsperpage ?? 7}
            disabled={!prefs || setPref.isPending}
            onChange={(e) => setPref.mutate({ key: 'cg_itemsperpage', value: Number(e.target.value) })}
          >
            {Array.from({ length: 14 }, (_, i) => i + 7).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Input>
        </FormGroup>
        <FormGroup>
          <Label for="pref-cg_defaultguide">{t('users.account.prefs.cg_defaultguide')}</Label>
          <Input
            id="pref-cg_defaultguide"
            type="select"
            value={prefs?.cg_defaultguide ?? ''}
            disabled={!prefs || setPref.isPending}
            onChange={(e) => setPref.mutate({ key: 'cg_defaultguide', value: (e.target.value || null) as UserPrefs['cg_defaultguide'] })}
          >
            <option value="">{t('users.account.prefs.cg_defaultguideNone')}</option>
            <option value="pony">Friendship is Magic</option>
            <option value="eqg">Equestria Girls</option>
          </Input>
        </FormGroup>
        {GUIDE_FLAGS.map(flag)}
      </section>

      <section>
        <h2>{t('users.account.sections.site')}</h2>
        {SITE_FLAGS.map(flag)}
        {config && (
          <FormGroup>
            <Label for="pref-p_vectorapp">{t('users.account.prefs.p_vectorapp')}</Label>
            <Input
              id="pref-p_vectorapp"
              type="select"
              value={prefs?.p_vectorapp ?? ''}
              disabled={!prefs || setPref.isPending}
              onChange={(e) => setPref.mutate({ key: 'p_vectorapp', value: e.target.value as UserPrefs['p_vectorapp'] })}
            >
              {Object.entries(config.vectorApps).map(([key, label]) => (
                <option key={key} value={key}>
                  {key === '' ? t('users.account.prefs.p_vectorappNone') : label}
                </option>
              ))}
            </Input>
          </FormGroup>
        )}
      </section>

      {isStaff && permission(authUser, 'staff') && (
        <section>
          <h2>{t('users.account.sections.staff')}</h2>
          {STAFF_FLAGS.map(flag)}
        </section>
      )}

      {isStaff && (
        <section>
          <h2>{t('users.account.sections.password')}</h2>
          <PasswordForm />
        </section>
      )}

      <section>
        <h2>{t('users.account.sections.discord')}</h2>
        <Button color="link" onClick={() => syncDiscord.mutate()} disabled={syncDiscord.isPending}>
          {t('users.account.discordSync')}
        </Button>
        <Button
          color="link"
          className="text-danger"
          disabled={unlinkDiscord.isPending}
          onClick={async () => {
            if (
              await confirm({
                title: t('users.account.discordUnlink'),
                body: t('users.account.discordUnlinkConfirm'),
                color: 'danger',
                confirmLabel: t('users.account.discordUnlink'),
              })
            ) {
              unlinkDiscord.mutate();
            }
          }}
        >
          {t('users.account.discordUnlink')}
        </Button>
        {syncDiscord.isSuccess && <span className="text-success ms-2">{t('users.account.discordSynced')}</span>}
        {unlinkDiscord.isSuccess && <span className="text-success ms-2">{t('users.account.discordUnlinked')}</span>}
      </section>

      <section>
        <h2>{t('users.account.sections.sessions')}</h2>
        <Button
          color="danger"
          outline
          disabled={signOutEverywhere.isPending}
          onClick={async () => {
            if (
              await confirm({
                title: t('users.account.signOutEverywhere'),
                body: t('users.account.signOutEverywhereConfirm'),
                color: 'danger',
                confirmLabel: t('users.account.signOutEverywhere'),
              })
            ) {
              signOutEverywhere.mutate();
            }
          }}
        >
          {t('users.account.signOutEverywhere')}
        </Button>
      </section>

      {user && <Link href={PATHS.USER_LONG(user)}>{t('users.contributions.backToProfile')}</Link>}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, locale } = ctx;

  const userId = parseUserIdParam(query.user);
  if (userId === null) {
    return notFound(ctx);
  }

  let user: Optional<GetUsersIdResult>;
  try {
    user = await userFetcher({ id: userId })();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  titleSetter(store, titleFactory({ user: user || null }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['users'])),
      userId,
      user: user || null,
    },
  };
});

export default AccountPage;
