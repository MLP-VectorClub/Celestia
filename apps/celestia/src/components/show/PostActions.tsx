import { FC, useState } from 'react';
import { Alert, Button } from 'reactstrap';

import { PostItem } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { PostEditDialog } from 'src/components/show/PostEditDialog';
import { PostFinishDialog } from 'src/components/show/PostFinishDialog';
import { PostImageDialog } from 'src/components/show/PostImageDialog';
import { describeApiError, useApiMutation, useAuth } from 'src/hooks';
import { PostService } from 'src/services/posts';
import { UnifiedErrorResponse } from 'src/types';
import { ENDPOINTS } from 'src/utils';
import { getPostActions } from 'src/utils/post-actions';

export const PostActions: FC<{ post: PostItem }> = ({ post }) => {
  const { user } = useAuth();
  const { confirm } = useDialog();
  const [finishOpen, setFinishOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [error, setError] = useState<UnifiedErrorResponse | null>(null);

  const invalidate = () => [
    [ENDPOINTS.POSTS({ showId: post.showId, kind: 'request' })],
    [ENDPOINTS.POSTS({ showId: post.showId, kind: 'reservation' })],
  ];
  const options = { invalidate, onSuccess: () => setError(null) };

  const reserve = useApiMutation(() => PostService.reserve(post.id), options);
  const unreserve = useApiMutation(() => PostService.unreserve(post.id), options);
  const unfinish = useApiMutation(() => PostService.unfinish(post.id), options);
  const approve = useApiMutation(() => PostService.approve(post.id), options);
  const unapprove = useApiMutation(() => PostService.unapprove(post.id), options);
  const deleteRequest = useApiMutation(() => PostService.deleteRequest(post.id), options);
  const unbreak = useApiMutation(() => PostService.unbreak(post.id), options);

  const actions = getPostActions(post, user);
  const mutations = [reserve, unreserve, unfinish, approve, unapprove, deleteRequest, unbreak];
  const busy = mutations.some((m) => m.isPending);

  const run = (mutation: (typeof mutations)[number]) => () => {
    setError(null);
    mutation.mutate(undefined as never, { onError: setError });
  };

  const confirmThen =
    (title: string, body: string, mutation: (typeof mutations)[number], color = 'danger') =>
    async () => {
      if (await confirm({ title, body, color, confirmLabel: title })) run(mutation)();
    };

  if (!Object.values(actions).some(Boolean)) return null;

  return (
    <div className="mt-2">
      <div className="d-flex flex-wrap gap-1">
        {actions.edit && (
          <Button size="sm" color="ui" onClick={() => setEditOpen(true)} disabled={busy}>
            Edit
          </Button>
        )}
        {actions.changeImage && (
          <Button size="sm" color="ui" onClick={() => setImageOpen(true)} disabled={busy}>
            Change image
          </Button>
        )}
        {actions.unbreak && (
          <Button size="sm" color="warning" onClick={run(unbreak)} disabled={busy}>
            Unbreak
          </Button>
        )}
        {actions.reserve && (
          <Button size="sm" color="primary" onClick={run(reserve)} disabled={busy}>
            <InlineIcon icon="plus" first /> Reserve
          </Button>
        )}
        {actions.finish && (
          <Button size="sm" color="success" onClick={() => setFinishOpen(true)} disabled={busy}>
            Mark as finished
          </Button>
        )}
        {actions.approve && (
          <Button size="sm" color="success" onClick={run(approve)} disabled={busy}>
            Approve
          </Button>
        )}
        {actions.unapprove && (
          <Button
            size="sm"
            color="warning"
            onClick={confirmThen('Remove approval', 'The post will be unlocked again.', unapprove, 'warning')}
            disabled={busy}
          >
            Remove approval
          </Button>
        )}
        {actions.unfinish && (
          <Button
            size="sm"
            color="warning"
            onClick={confirmThen('Unfinish', 'The finished image will be removed from this post.', unfinish, 'warning')}
            disabled={busy}
          >
            Unfinish
          </Button>
        )}
        {actions.unreserve && (
          <Button
            size="sm"
            color="link"
            onClick={confirmThen('Cancel reservation', 'The request will be open for others to reserve again.', unreserve)}
            disabled={busy}
          >
            Cancel reservation
          </Button>
        )}
        {actions.deleteRequest && (
          <Button size="sm" color="danger" onClick={confirmThen('Delete request', 'This cannot be undone.', deleteRequest)} disabled={busy}>
            Delete
          </Button>
        )}
      </div>
      {error && (
        <Alert color="danger" fade={false} className="mt-2 mb-0 py-1" role="alert">
          {describeApiError(error)}
        </Alert>
      )}
      {actions.edit && <PostEditDialog post={post} isOpen={editOpen} onClose={() => setEditOpen(false)} />}
      {actions.changeImage && <PostImageDialog post={post} isOpen={imageOpen} onClose={() => setImageOpen(false)} />}
      {actions.finish && <PostFinishDialog post={post} isOpen={finishOpen} onClose={() => setFinishOpen(false)} />}
    </div>
  );
};
