import { useTranslations } from 'next-intl';
import { FC, ReactNode, useState } from 'react';
import { Button } from 'reactstrap';

import { GetPostsResult, PostItem } from '@mlp-vectorclub/api-types';
import styles from 'modules/PostList.module.scss';
import StatusAlert from 'src/components/shared/StatusAlert';
import { PostCreateDialog } from 'src/components/show/PostCreateDialog';
import { PostListItem } from 'src/components/show/PostListItem';
import { RibbonHeading } from 'src/components/show/RibbonHeading';
import { StaffReservationDialog } from 'src/components/show/StaffReservationDialog';
import { useAuth, usePosts } from 'src/hooks';
import { useLocationHash } from 'src/hooks/location-hash';
import { Status } from 'src/types';
import { permission } from 'src/utils';

interface PropTypes {
  showId: number;
  kind: 'request' | 'reservation';
  initialData?: GetPostsResult;
}

const REQUEST_TYPES = ['chr', 'obj', 'bg'] as const;

const Cards: FC<{ posts: PostItem[] }> = ({ posts }) => {
  const t = useTranslations();
  const hash = useLocationHash();
  return (
    <ul className={styles.list} data-empty={t('show.post.none')}>
      {posts.map((post) => (
        <PostListItem key={post.id} post={post} highlighted={hash === `post-${post.id}`} />
      ))}
    </ul>
  );
};

/**
 * Either the reservations or the requests of a show, arranged like the old site's: what is still open (requests grouped by what they ask
 * for), then what is finished
 */
export const PostList: FC<PropTypes> = ({ showId, kind, initialData }) => {
  const t = useTranslations();
  const { posts, status } = usePosts({ showId, kind }, initialData);
  const { signedIn, user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [addingFinished, setAddingFinished] = useState(false);
  const isRequest = kind === 'request';
  const canAddFinished = !isRequest && signedIn && permission(user, 'staff');
  const canCreate = signedIn && (isRequest || permission(user, 'member'));

  const finished = (posts ?? []).filter((post) => post.finishedAt !== null);
  const unfinished = (posts ?? []).filter((post) => post.finishedAt === null);

  const createButton = (canCreate || (isRequest && !signedIn)) && (
    <>
      <Button
        color="success"
        size="sm"
        onClick={() => setCreating(true)}
        disabled={!signedIn}
        id={isRequest ? 'request-btn' : 'reservation-btn'}
      >
        {t(isRequest ? 'show.post.makeRequest' : 'show.post.makeReservation')}
      </Button>
      {signedIn && <PostCreateDialog showId={showId} kind={kind} isOpen={creating} onClose={() => setCreating(false)} />}
    </>
  );

  const addFinishedButton: ReactNode = canAddFinished && (
    <>
      <Button color="ui" size="sm" onClick={() => setAddingFinished(true)} id="add-reservation-btn">
        {t('show.post.addFinishedReservation')}
      </Button>
      <StaffReservationDialog showId={showId} isOpen={addingFinished} onClose={() => setAddingFinished(false)} />
    </>
  );

  return (
    <section id={isRequest ? 'requests' : 'reservations'}>
      <StatusAlert status={status === Status.FAILURE ? status : Status.SUCCESS} subject={t('show.post.loadingSubject')} />
      <div className="unfinished">
        <RibbonHeading>
          {t(isRequest ? 'show.post.listOfRequests' : 'show.post.listOfReservations')}
          {createButton}
        </RibbonHeading>
        {isRequest ? (
          REQUEST_TYPES.map((type) => (
            <div key={type} className="group" id={`group-${type}`}>
              <h3 className={styles.groupHeading}>{t(`show.post.sections.${type}`)}</h3>
              <Cards posts={unfinished.filter((post) => post.type === type)} />
            </div>
          ))
        ) : (
          <Cards posts={unfinished} />
        )}
      </div>
      <div className="finished">
        <RibbonHeading>
          {t(isRequest ? 'show.post.finishedRequests' : 'show.post.finishedReservations')}
          {addFinishedButton}
        </RibbonHeading>
        <Cards posts={finished} />
      </div>
    </section>
  );
};
