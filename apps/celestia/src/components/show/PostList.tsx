import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Button } from 'reactstrap';

import { GetPostsResult } from '@mlp-vectorclub/api-types';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import StatusAlert from 'src/components/shared/StatusAlert';
import { PostCreateDialog } from 'src/components/show/PostCreateDialog';
import { PostListItem } from 'src/components/show/PostListItem';
import { useAuth, usePosts } from 'src/hooks';
import { permission } from 'src/utils';

interface PropTypes {
  showId: number;
  kind: 'request' | 'reservation';
  initialData?: GetPostsResult;
}

export const PostList: FC<PropTypes> = ({ showId, kind, initialData }) => {
  const t = useTranslations();
  const { posts, status } = usePosts({ showId, kind }, initialData);
  const { signedIn, user } = useAuth();
  const [creating, setCreating] = useState(false);
  const canCreate = signedIn && (kind === 'request' || permission(user, 'member'));
  return (
    <section id={kind === 'request' ? 'requests' : 'reservations'}>
      <h2>{t(`show.post.${kind === 'request' ? 'requestsHeading' : 'reservationsHeading'}`)}</h2>
      {canCreate && (
        <>
          <Button color="success" size="sm" className="mb-3" onClick={() => setCreating(true)}>
            {kind === 'request' ? 'Add request' : 'Add reservation'}
          </Button>
          <PostCreateDialog showId={showId} kind={kind} isOpen={creating} onClose={() => setCreating(false)} />
        </>
      )}
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
