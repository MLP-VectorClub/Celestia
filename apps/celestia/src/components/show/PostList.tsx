import { useTranslations } from 'next-intl';
import { FC } from 'react';

import { GetPostsResult } from '@mlp-vectorclub/api-types';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import StatusAlert from 'src/components/shared/StatusAlert';
import { PostListItem } from 'src/components/show/PostListItem';
import { usePosts } from 'src/hooks';

interface PropTypes {
  showId: number;
  kind: 'request' | 'reservation';
  initialData?: GetPostsResult;
}

export const PostList: FC<PropTypes> = ({ showId, kind, initialData }) => {
  const t = useTranslations();
  const { posts, status } = usePosts({ showId, kind }, initialData);
  return (
    <section id={kind === 'request' ? 'requests' : 'reservations'}>
      <h2>{t(`show.post.${kind === 'request' ? 'requestsHeading' : 'reservationsHeading'}`)}</h2>
      <StatusAlert status={status} subject={t('show.post.loadingSubject')} />
      {posts?.length === 0 && <NoResultsAlert message={t(`show.post.${kind === 'request' ? 'noRequests' : 'noReservations'}`)} />}
      {posts && posts.length > 0 && (
        <ul className="list-unstyled">
          {posts.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </ul>
      )}
    </section>
  );
};
