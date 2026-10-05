import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';

import { PostItem } from '@mlp-vectorclub/api-types';
import styles from 'modules/PostList.module.scss';
import ExternalLink from 'src/components/shared/ExternalLink';
import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import UserLink from 'src/components/shared/UserLink';
import { PostActions } from 'src/components/show/PostActions';
import { DeviationImage, ScreencapImage } from 'src/components/show/PostImages';
import { permission } from 'src/utils';
import { useAuth } from 'src/hooks';

/** The link of a post's own address (`/s/1z`, the ID in base 36) */
const postAddress = (post: PostItem) => `/s/${post.id.toString(36)}`;

const openSubmissionsUrl = (name: string) =>
  `https://www.deviantart.com/mlp-vectorclub/messages/?log_type=1&instigator_module_type=21&instigator_username=${encodeURIComponent(name)}&bpp_status=3&display_order=desc`;

/**
 * A request or reservation as a card, laid out like the old site's: the image (the finished submission once there is one), the description,
 * when and by whom it was posted, reserved and finished, then the actions
 */
export const PostListItem: FC<{ post: PostItem }> = ({ post }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isStaff = permission(user, 'staff');
  const isRequest = post.kind === 'request';
  const finished = post.deviationId !== null && post.finishedAt !== null;
  const noQuotes = post.label.includes('"');

  return (
    <li id={`post-${post.id}`} data-kind={post.kind} className={classNames(styles.card, { [styles.broken]: post.broken })}>
      {finished && post.deviationId ? <DeviationImage post={post} deviationId={post.deviationId} /> : <ScreencapImage post={post} />}

      {post.label && <span className={classNames(styles.label, { [styles.noQuotes]: noQuotes })}>{post.label}</span>}

      <em className={styles.infoLine}>
        {isRequest ? t('show.post.requested') : t('show.post.reserved')}{' '}
        <Link href={postAddress(post)}>
          <TimeAgo date={post.postedAt} />
        </Link>
        {post.postedBy && (
          <>
            {' '}
            {t('show.post.by')} <UserLink id={post.postedBy.id} name={post.postedBy.name} />
          </>
        )}
      </em>

      {isRequest && post.reservedBy && post.reservedAt && (
        <em className={styles.infoLine}>
          {t('show.post.reserved')} <strong>{<TimeAgo date={post.reservedAt} />}</strong>
        </em>
      )}

      {finished && (
        <>
          {post.type && (
            <em className={styles.infoLine}>
              {t.rich('show.post.postedInSection', { section: t(`show.post.sections.${post.type}`), strong: (chunks) => <strong>{chunks}</strong> })}
            </em>
          )}
          {post.finishedAt && (
            <em className={styles.infoLine}>
              {t('show.post.finished')} <strong>{<TimeAgo date={post.finishedAt} />}</strong>
            </em>
          )}
          <span className={styles.infoLine}>
            <ExternalLink href={post.fullsizeUrl}>
              <InlineIcon icon="link" first />
              {t('show.post.originalImage')}
            </ExternalLink>
          </span>
          {isStaff && !post.approved && post.reservedBy && (
            <span className={styles.infoLine}>
              <ExternalLink href={openSubmissionsUrl(post.reservedBy.name)}>
                <InlineIcon icon="arrow-right" first />
                {t('show.post.openSubmissions')}
              </ExternalLink>
            </span>
          )}
        </>
      )}

      {post.reservedBy && (
        <span className={styles.reserver}>
          <UserLink id={post.reservedBy.id} name={post.reservedBy.name} />
        </span>
      )}

      {post.overdue && (
        <strong className={classNames(styles.note, styles.contest)} title={t('show.post.contestHint')}>
          <InlineIcon icon="info-circle" first />
          {t('show.post.canBeContested')}
        </strong>
      )}
      {post.broken && (
        <strong className={classNames(styles.note, styles.brokenNote, 'broken-note')} title={t('show.post.brokenHint')}>
          <InlineIcon icon="plug" first />
          {t('show.post.deemedBroken')}
        </strong>
      )}

      <div className={styles.actions}>
        <PostActions post={post} />
      </div>
    </li>
  );
};
