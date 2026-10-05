import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Alert, Button } from 'reactstrap';

import { UserProfile } from '@mlp-vectorclub/api-types';
import ExternalLink from 'src/components/shared/ExternalLink';
import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, useApiMutation, useConfig } from 'src/hooks';
import { AccountService } from 'src/services/account';
import { ENDPOINTS } from 'src/utils';

/** What the old site's "Discord account" section says and offers: the linked account, syncing it and unlinking it */
export const DiscordSection: FC<{ profile: UserProfile; sameUser: boolean }> = ({ profile, sameUser }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const userId = profile.user.id;
  const discord = profile.discord;
  const refresh = () => void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.USER_PROFILE({ id: userId })] });
  const sync = useApiMutation(() => AccountService.syncDiscord(userId), { onSuccess: refresh });
  const unlink = useApiMutation(() => AccountService.unlinkDiscord(userId), { onSuccess: refresh });
  const who = sameUser ? 'own' : 'other';
  const error = sync.error ?? unlink.error;

  const unlinkButton = (
    <Button
      color="orange"
      className="unlink"
      disabled={unlink.isPending}
      onClick={async () => {
        if (await confirm({ title: t('users.account.discordUnlink'), body: t(`users.account.discordUnlinkBody.${who}`), color: 'danger', confirmLabel: t('users.account.discordUnlink') })) {
          unlink.mutate();
        }
      }}
    >
      <InlineIcon icon="times" first />
      {t('users.account.unlink')}
    </Button>
  );

  return (
    <section id="discord-connect">
      <h2>
        <span title={t('users.profile.visibleTo.staff')} className="me-1">
          <InlineIcon icon="lock" size="sm" />
        </span>
        {t('users.account.sections.discord')}
      </h2>
      {discord && (
        <p>
          {t.rich(discord.linked ? `users.account.discordLinked.${who}` : `users.account.discordBound.${who}`, { tag: () => <strong>{discord.tag}</strong> })}{' '}
          {discord.linked &&
            (discord.serverMember
              ? t(`users.account.discordJoined.${who}`)
              : t.rich(`users.account.discordNotJoined.${who}`, { server: (c) => <ExternalLink href={config?.discordInviteLink ?? 'https://discord.mlpvector.club'}>{c}</ExternalLink> }))}
          {!discord.linked && ` ${t('users.account.discordManual')}`}
        </p>
      )}
      {discord?.linked && (
        <>
          <p id="discord-sync-info">
            {t.rich(`users.account.discordSyncInfo.${who}`, { strong: (c) => <strong>{c}</strong> })}
            <br />
            {t(`users.account.discordLastUpdated.${who}`)} {discord.lastSynced ? <TimeAgo date={discord.lastSynced} /> : t('users.account.never')}.
            {!discord.canSync && <span className="wait-message"> {t('users.account.discordWait', { minutes: Math.round((discord.syncCooldown ?? 300) / 60) })}</span>}
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-1">
            <Button color="success" className="sync" disabled={sync.isPending || !discord.canSync} onClick={() => sync.mutate()}>
              <InlineIcon icon="sync" first />
              {t('users.account.sync')}
            </Button>
            {unlinkButton}
          </div>
        </>
      )}
      {(!discord || !discord.linked) && (
        <>
          <p>{sameUser ? t('users.account.discordLinkHint') : discord ? t('users.account.discordUnlinkHint') : t('users.account.discordNotLinkedYet')}</p>
          <div className="d-flex flex-wrap justify-content-center gap-1">{discord && !discord.linked && unlinkButton}</div>
        </>
      )}
      {error && (
        <Alert color="danger" fade={false} role="alert">
          {describeApiError(error)}
        </Alert>
      )}
    </section>
  );
};
