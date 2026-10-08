import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { FC, useMemo, useState } from 'react';
import { Alert } from 'reactstrap';

import styles from 'modules/WebsocketDiagnostics.module.scss';
import { AdminPage } from 'src/components/admin/AdminPage';
import InlineIcon from 'src/components/shared/InlineIcon';
import UserLink from 'src/components/shared/UserLink';
import { useAuth } from 'src/hooks';
import { DiagnosticsClient, DiagnosticsState, useWebsocketDiagnostics } from 'src/hooks/websocket-diagnostics';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';
import { permission } from 'src/utils/permission';

const ALERT_COLORS: Record<DiagnosticsState, string> = {
  checking: 'info',
  connected: 'success',
  disconnected: 'danger',
  unconfigured: 'warning',
  denied: 'danger',
};

/** `https://next.mlpvector.club` → `next.mlpvector.club`, whatever else a client sent as its origin is shown as it came */
const originHost = (origin: string): string => {
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
};

/** Connections that come from the same network (the server hashes the address), as the old diagnostics listed them */
const NetworkCard: FC<{ id: string; index: number; connections: DiagnosticsClient[] }> = ({ id, index, connections }) => {
  const t = useTranslations();
  const isCurrent = connections.some((c) => c.current);
  const users = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; count: number }>();
    connections.forEach(({ user }) => {
      if (!user.name) return;
      const known = byId.get(user.id);
      if (known) known.count++;
      else byId.set(user.id, { id: user.id, name: user.name, count: 1 });
    });
    return [...byId.values()];
  }, [connections]);
  const pages = useMemo(() => {
    // The same path on the old and the new site are different pages
    const byPage = new Map<string, { page: string; origin?: string; since?: string }>();
    connections.forEach(
      (c) => c.page && byPage.set(`${c.origin ?? ''}${c.page}`, { page: c.page, origin: c.origin, since: c.connectedSince })
    );
    return [...byPage.entries()];
  }, [connections]);

  return (
    <li className={styles.network}>
      <h3>
        {t('admin.wsdiag.network', { n: index + 1 })}
        {isCurrent && <InlineIcon icon="map-marker-alt" className={styles.current} title={t('admin.wsdiag.yourNetwork')} last />}
      </h3>
      <p>
        <strong>{t('admin.wsdiag.id')}</strong> <code>{id}</code>
      </p>
      {users.length > 0 && (
        <>
          <p>
            <strong>{t('admin.wsdiag.users')}</strong>
          </p>
          <ul>
            {users.map(({ id: userId, name, count }) => (
              <li key={userId}>
                <UserLink name={name} id={Number(userId)} /> {count > 1 && `(${count})`}
              </li>
            ))}
          </ul>
        </>
      )}
      {pages.length > 0 && (
        <>
          <p>
            <strong>{t('admin.wsdiag.pages')}</strong>
          </p>
          <ul>
            {pages.map(([key, { page, origin, since }]) => (
              <li key={key}>
                {origin && <span className="text-muted">{originHost(origin)} </span>}
                <a href={`${origin ?? ''}${page}`} target="_blank" rel="noreferrer">
                  {page}
                </a>{' '}
                {since && `(${since})`}
              </li>
            ))}
          </ul>
        </>
      )}
    </li>
  );
};

/** What the websocket server sees: who is connected, from which network and on which page. Developers only */
const WebsocketDiagnosticsPage: NextPage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const [hovering, setHovering] = useState(false);
  const { state, clients, responseTimes, beat } = useWebsocketDiagnostics(hovering);
  const isDeveloper = permission(user, 'developer');
  const networks = useMemo(() => {
    const groups = new Map<string, DiagnosticsClient[]>();
    clients.forEach((c) => groups.set(c.network ?? '', [...(groups.get(c.network ?? '') ?? []), c]));
    return [...groups.entries()];
  }, [clients]);
  const average = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null;

  return (
    <AdminPage section="wsdiag">
      {!isDeveloper ? (
        <p className="text-center text-muted">{t('admin.wsdiag.developerOnly')}</p>
      ) : (
        <>
          <h2>
            {t('admin.wsdiag.status')}{' '}
            <span
              key={beat}
              className={`${styles.heart} ${state === 'connected' ? styles.beat : ''} ${state === 'connected' ? '' : styles.dead}`}
              aria-hidden
            >
              ♥
            </span>{' '}
            {state === 'connected' && <span className={styles.responseTime}>{average === null ? '…' : `${average}ms`}</span>}
          </h2>
          <Alert color={ALERT_COLORS[state]}>
            {hovering && state === 'connected' ? t('admin.wsdiag.paused') : t(`admin.wsdiag.states.${state}`)}
          </Alert>
          <ul className={styles.networks} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            {networks.map(([id, connections], index) => (
              <NetworkCard key={id} id={id} index={index} connections={connections} />
            ))}
          </ul>
        </>
      )}
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('wsdiag', 'developer');

export default WebsocketDiagnosticsPage;
