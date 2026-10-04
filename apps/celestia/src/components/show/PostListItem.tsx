import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FC } from 'react';
import { Badge } from 'reactstrap';

import { PostItem } from '@mlp-vectorclub/api-types';
import ExternalLink from 'src/components/shared/ExternalLink';
import TimeAgo from 'src/components/shared/TimeAgo';
import UserLink from 'src/components/shared/UserLink';
import { PostActions } from 'src/components/show/PostActions';
import { createFavMeUrl } from 'src/utils/url';

/**
 * A request or reservation on a show's page. Actions (reserve, finish, approve, …) are added by the write flows, this renders the data
 */
export const PostListItem: FC<{ post: PostItem }> = ({ post }) => {
  const t = useTranslations();
  return (
    <li id={`post-${post.id}`} className="d-flex mb-3">
      <ExternalLink href={post.fullsizeUrl} className="flex-shrink-0 me-3">
        <Image src={post.previewUrl} alt={post.label} width={160} height={120} unoptimized style={{ objectFit: 'cover' }} />
      </ExternalLink>
      <div>
        <h3 className="h5 mb-1">
          {post.label}
          {post.type && (
            <Badge color="secondary" className="ms-2">
              {t(`show.post.types.${post.type}`)}
            </Badge>
          )}
          {post.approved && (
            <Badge color="success" className="ms-2">
              {t('show.post.approved')}
            </Badge>
          )}
          {post.broken && (
            <Badge color="danger" className="broken-note ms-2">
              {t('show.post.broken')}
            </Badge>
          )}
          {post.overdue && (
            <Badge color="warning" className="ms-2">
              {t('show.post.overdue')}
            </Badge>
          )}
        </h3>
        <small className="d-block text-muted">
          {post.kind === 'request' ? t('show.post.requested') : t('show.post.reserved')} <TimeAgo date={post.postedAt} />
          {post.postedBy && (
            <>
              {' '}
              {t('show.post.by')} <UserLink id={post.postedBy.id} name={post.postedBy.name} />
            </>
          )}
        </small>
        {post.reservedBy && (
          <small className="d-block text-muted">
            {t('show.post.reservedBy')} <UserLink id={post.reservedBy.id} name={post.reservedBy.name} />
            {post.reservedAt && (
              <>
                {' '}
                <TimeAgo date={post.reservedAt} />
              </>
            )}
          </small>
        )}
        {post.deviationId && (
          <small className="d-block">
            {t('show.post.finishedAs')}{' '}
            <ExternalLink href={createFavMeUrl(post.deviationId)}>{createFavMeUrl(post.deviationId)}</ExternalLink>
          </small>
        )}
        <PostActions post={post} />
      </div>
    </li>
  );
};
