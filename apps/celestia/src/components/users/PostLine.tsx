import Image from 'next/image';
import { FC } from 'react';

import { PostItem } from '@mlp-vectorclub/api-types';
import ExternalLink from 'src/components/shared/ExternalLink';
import TimeAgo from 'src/components/shared/TimeAgo';
import UserLink from 'src/components/shared/UserLink';
import { createFavMeUrl } from 'src/utils/url';

/**
 * Compact summary of a request or reservation that is shown outside of its show's page
 */
export const PostLine: FC<{ post: PostItem; showReserver?: boolean }> = ({ post, showReserver = false }) => (
  <div className="d-flex align-items-center mb-2">
    <Image
      src={post.previewUrl}
      alt={post.label}
      width={80}
      height={60}
      unoptimized
      className="me-2 flex-shrink-0"
      style={{ objectFit: 'cover' }}
    />
    <div>
      <strong>{post.label}</strong>
      {post.deviationId && (
        <>
          {' '}
          (<ExternalLink href={createFavMeUrl(post.deviationId)}>{post.deviationId}</ExternalLink>)
        </>
      )}
      <br />
      <small className="text-muted">
        <TimeAgo date={post.finishedAt ?? post.reservedAt ?? post.postedAt} />
        {showReserver && post.reservedBy && (
          <>
            {' · '}
            <UserLink id={post.reservedBy.id} name={post.reservedBy.name} />
          </>
        )}
        {post.approved && ' · ✔'}
      </small>
    </div>
  </div>
);
