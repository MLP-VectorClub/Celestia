import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Alert, Button } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, useApiMutation } from 'src/hooks';
import { AccountService } from 'src/services/account';
import { useAppDispatch } from 'src/store';
import { signOutThunk } from 'src/store/thunks';
import { ENDPOINTS } from 'src/utils';
import { getBrowserIcon } from 'src/utils/browser-icon';

/**
 * The browsers a user is signed in on, each with a button to end that session, and one to end all of them. Staff see the sessions of the user whose
 * account page they have open; the visitor's own account keeps using the endpoints of the signed in user
 */
export const SessionsSection: FC<{ userId: number; own: boolean }> = ({ userId, own }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const dispatch = useAppDispatch();
  const sessionsKey = own ? '/users/sessions' : `/users/${userId}/sessions`;
  const sessions = useQuery({
    queryKey: [sessionsKey],
    queryFn: () => (own ? AccountService.getSessions() : AccountService.getSessionsOf(userId)).then((r) => r.data.sessions),
  });
  const remove = useApiMutation((id: string) => (own ? AccountService.deleteSession(id) : AccountService.deleteSessionOf(userId, id)), {
    invalidate: [[sessionsKey]],
  });
  const everywhere = useApiMutation(() => (own ? AccountService.signOutEverywhere() : AccountService.deleteSessionsOf(userId)), {
    invalidate: [[ENDPOINTS.USERS_ME], [sessionsKey]],
  });
  const list = sessions.data ?? [];
  const error = remove.error ?? everywhere.error;

  return (
    <section id="sessions">
      <h2>
        <span title={t('users.profile.visibleTo.staff')} className="me-1">
          <InlineIcon icon="lock" size="sm" />
        </span>
        {t('users.account.sections.sessions')}
      </h2>
      {list.length > 0 ? (
        <>
          <p>{own ? t('users.account.sessionsIntro') : t('users.account.sessionsIntroOther')}</p>
          <ul className="session-list list-unstyled d-flex flex-wrap gap-2">
            {list.map((s) => (
              <li key={s.id} id={`session-${s.id}`} className="border rounded p-2 text-center" style={{ minWidth: 220 }}>
                {getBrowserIcon(s.device) && (
                  <span
                    role="img"
                    aria-hidden="true"
                    className="browser-icon d-block mx-auto mb-2"
                    style={{
                      height: 96,
                      width: '100%',
                      backgroundImage: `url(${getBrowserIcon(s.device)})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundSize: 'contain',
                    }}
                  />
                )}
                <span className="browser d-block fw-bold">{s.device}</span>
                <div className="my-1">
                  {s.current ? (
                    <Button color="warning" size="sm" className="remove" onClick={() => void dispatch(signOutThunk())}>
                      <InlineIcon icon="sign-out-alt" first />
                      {t('users.account.signOut')}
                    </Button>
                  ) : (
                    <Button
                      color="red"
                      size="sm"
                      className="remove"
                      disabled={remove.isPending}
                      onClick={async () => {
                        if (
                          await confirm({
                            title: t('users.account.deleteSession'),
                            body: t('users.account.deleteSessionBody', { device: s.device }),
                            color: 'danger',
                            confirmLabel: t('users.account.deleteSessionConfirm'),
                          })
                        ) {
                          remove.mutate(s.id);
                        }
                      }}
                    >
                      <InlineIcon icon="trash" first />
                      {t('users.account.delete')}
                    </Button>
                  )}
                  {s.userAgent && (
                    <Button
                      color="darkblue"
                      size="sm"
                      className="useragent ms-1"
                      onClick={() =>
                        void confirm({
                          title: t('users.account.userAgentTitle'),
                          body: <code className="d-block text-break">{s.userAgent}</code>,
                          confirmLabel: t('common.actions.close'),
                        })
                      }
                    >
                      <InlineIcon icon="eye" first />
                      {t('users.account.userAgent')}
                    </Button>
                  )}
                </div>
                {s.createdAt && (
                  <small className="d-block created">
                    {t('users.account.created')} <TimeAgo date={s.createdAt} />
                  </small>
                )}
                <small className="d-block used">
                  {s.current ? (
                    <em>{t('users.account.currentSession')}</em>
                  ) : (
                    <>
                      {t('users.account.lastUsed')} <TimeAgo date={s.lastActiveAt} />
                    </>
                  )}
                </small>
              </li>
            ))}
          </ul>
          <p>
            <Button
              color="warning"
              id="sign-out-everywhere"
              disabled={everywhere.isPending}
              onClick={async () => {
                if (
                  await confirm({
                    title: t('users.account.signOutEverywhereTitle'),
                    body: t('users.account.signOutEverywhereBody'),
                    color: 'danger',
                    confirmLabel: t('users.account.signOutEverywhere'),
                  })
                ) {
                  everywhere.mutate();
                }
              }}
            >
              <InlineIcon icon="sign-out-alt" first />
              {t('users.account.signOutEverywhere')}
            </Button>
          </p>
        </>
      ) : (
        <p>{sessions.isLoading ? t('users.staffTools.loading') : t('users.account.noSessions')}</p>
      )}
      {error && (
        <Alert color="danger" fade={false} role="alert">
          {describeApiError(error)}
        </Alert>
      )}
    </section>
  );
};
