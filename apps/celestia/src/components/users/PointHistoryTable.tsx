import { GetUsersIdPersonalGuidePointHistoryResult } from '@went.tf/mlp-vectorclub-api-types';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, ReactNode } from 'react';

import styles from 'modules/PointHistoryTable.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import UserLink from 'src/components/shared/UserLink';
import { PATHS } from 'src/paths';

type Entry = GetUsersIdPersonalGuidePointHistoryResult['entries'][number];

/** What Luna adds to the data of an entry (see `GET /users/{id}/personal-guide/point-history`) */
interface EntryData {
  id?: number;
  label?: string;
  comment?: string;
  by?: number;
  byName?: string | null;
  gone?: boolean;
  private?: boolean;
  previewColor?: string | null;
}

/** The sign the old page used: a real minus, a plus for gains */
export const formatAmount = (amount: number): string => (amount > 0 ? `+${amount}` : amount < 0 ? `−${-amount}` : '0');

const Gone: FC = () => {
  const t = useTranslations();
  return <InlineIcon icon="trash" className="text-danger" title={t('users.pointHistory.deleted')} />;
};

/** The "Details" cell of an entry: what the change was about, as far as the logged data tells */
const Details: FC<{ entry: Entry; ownerId: number }> = ({ entry, ownerId }) => {
  const t = useTranslations();
  const data = (entry.data ?? null) as EntryData | null;

  if (data === null) return <>{entry.changeType === 'free_trial' ? t('users.pointHistory.free') : '—'}</>;

  switch (entry.changeType) {
    case 'post_approved':
    case 'post_unapproved': {
      const label = t('users.pointHistory.post', { id: data.id ?? 0 });
      return data.gone || data.id === undefined ? (
        <>
          {label} <Gone />
        </>
      ) : (
        <Link href={`/s/${data.id.toString(36)}`}>{label}</Link>
      );
    }
    case 'appearance_add':
    case 'appearance_del': {
      const label = data.label ?? t('users.pointHistory.appearance');
      if (data.gone || data.id === undefined) {
        return (
          <>
            {label} (#{data.id}) <Gone />
          </>
        );
      }
      return (
        <Link href={PATHS.PCG_APPEARANCE(ownerId, { id: data.id, label })}>
          {data.private ? (
            <InlineIcon icon="lock" first className="text-orange" title={t('colorGuide.item.private')} />
          ) : (
            data.previewColor && <span className={styles.preview} style={{ background: data.previewColor }} />
          )}
          {label}
        </Link>
      );
    }
    case 'manual_give':
    case 'manual_take': {
      // Only staff are told who it was, the others see that a staff member did it
      let by: ReactNode;
      if (data.by === undefined) by = t('users.pointHistory.aStaffMember');
      else if (data.byName) by = <UserLink id={data.by} name={data.byName} />;
      else by = t('users.pointHistory.unknownUser');
      return (
        <>
          {t.rich('users.pointHistory.by', { who: () => by })}
          {data.comment && (
            <>
              <br />
              <q>{data.comment}</q>
            </>
          )}
        </>
      );
    }
    default:
      return <pre className={styles.raw}>{JSON.stringify(data, null, 2)}</pre>;
  }
};

/** The old page's table of changes: green rows for points gained, red for points spent */
export const PointHistoryTable: FC<{ entries: Entry[]; ownerId: number }> = ({ entries, ownerId }) => {
  const t = useTranslations();
  return (
    <div className="table-responsive">
      <table id="history-entries" className={styles.table}>
        <thead>
          <tr>
            <th>{t('users.pointHistory.reason')}</th>
            <th>{t('users.pointHistory.details')}</th>
            <th>{t('users.pointHistory.amount')}</th>
            <th>{t('users.pointHistory.when')}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className={classNames(entry.amount > 0 ? styles.gain : styles.loss)}
              data-testid={`history-${entry.changeType}`}
            >
              <td>{entry.reason}</td>
              <td>
                <Details entry={entry} ownerId={ownerId} />
              </td>
              <td>{formatAmount(entry.amount)}</td>
              <td>
                <InlineIcon icon="clock" first />
                <TimeAgo date={entry.createdAt} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
