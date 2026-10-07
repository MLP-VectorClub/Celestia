import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';

import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import { NOTIFICATIONS_KEY, useNotificationSocket, useNotifications } from 'src/hooks/notifications';
import { useApiMutation } from 'src/hooks';
import { AccountService } from 'src/services/account';
import { formatShowId } from 'src/utils/show';

const NotificationItem: FC<{ id: number }> = ({ id }) => {
  const t = useTranslations();
  const { data } = useNotifications(true);
  const notification = data?.find((n) => n.id === id);
  const markRead = useApiMutation(() => AccountService.markNotificationRead(id), { invalidate: [[NOTIFICATIONS_KEY]] });
  if (!notification) return null;

  const { post, type } = notification;
  const href = post ? `/s/${post.id.toString(36)}` : null;
  const text = post
    ? t.rich(type === 'post-finished' ? 'common.sidebar.notificationPostFinished' : 'common.sidebar.notificationPostApproved', {
        post: (chunks) => (href ? <Link href={href}>{chunks}</Link> : chunks),
        show: formatShowId(post.show),
      })
    : type === 'post-finished'
      ? t('common.sidebar.notificationRequestGone')
      : t('common.sidebar.notificationPostGone');

  return (
    <li>
      {text}{' '}
      <span className="nobr">
        &ndash; <TimeAgo date={notification.createdAt} tooltip={false} />
        <button
          type="button"
          className="mark-read variant-green btn btn-link p-0"
          title={t('common.sidebar.notificationMarkRead')}
          aria-label={t('common.sidebar.notificationMarkRead')}
          disabled={markRead.isPending}
          onClick={() => markRead.mutate(undefined as never)}
        >
          <InlineIcon icon="check" />
        </button>
      </span>
    </li>
  );
};

/** The unread notifications of the signed in visitor, hidden while there are none */
const SidebarNotifications: FC = () => {
  const t = useTranslations();
  const { data } = useNotifications(true);
  useNotificationSocket(true);
  if (!data || data.length === 0) return null;

  return (
    <section className="notifications">
      <h2>{t('common.sidebar.unreadNotifications')}</h2>
      <ul className="notif-list">
        {data.map((n) => (
          <NotificationItem key={n.id} id={n.id} />
        ))}
      </ul>
    </section>
  );
};

export default SidebarNotifications;
