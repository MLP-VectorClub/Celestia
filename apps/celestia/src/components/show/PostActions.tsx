import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Alert, Button } from 'reactstrap';

import { PostItem } from '@mlp-vectorclub/api-types';
import { IconButton } from 'src/components/shared/IconButton';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { PostEditDialog } from 'src/components/show/PostEditDialog';
import { PostFinishDialog } from 'src/components/show/PostFinishDialog';
import { PostShareButton } from 'src/components/show/PostShareButton';
import { describeApiError, useApiMutation, useAuth } from 'src/hooks';
import { PostService } from 'src/services/posts';
import { UnifiedErrorResponse } from 'src/types';
import { ENDPOINTS } from 'src/utils';
import { getPostActions } from 'src/utils/post-actions';

interface ActionItem {
  key: string;
  icon: IconProp;
  color: 'darkblue' | 'blue' | 'red' | 'orange' | 'green';
  label: string;
  onClick: () => void;
  className?: string;
}

export const PostActions: FC<{ post: PostItem }> = ({ post }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { confirm } = useDialog();
  const [finishOpen, setFinishOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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

  const actions = getPostActions(post, user);
  const mutations = [reserve, unreserve, unfinish, approve, unapprove, deleteRequest];
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

  const ask = (title: string, body: string, mutation: (typeof mutations)[number], color = 'danger') =>
    confirmThen(title, body, mutation, color);
  const isOwnReservation = user.id !== null && post.reservedBy?.id === user.id;

  // The same buttons in the same order as the old site's post cards; three or more of them (Share included) shrink to icons with a tooltip
  const items: ActionItem[] = [];
  if (actions.edit)
    items.push({
      key: 'edit',
      icon: 'pencil-alt',
      color: 'darkblue',
      label: t('show.post.actions.edit'),
      onClick: () => setEditOpen(true),
      className: 'edit',
    });
  if (actions.unreserve) {
    items.push({
      key: 'cancel',
      icon: 'user-times',
      color: 'red',
      label: t('show.post.actions.cancelReservation'),
      onClick: ask(t('show.post.actions.cancelReservation'), t('show.post.actions.cancelReservationBody'), unreserve),
      className: 'cancel',
    });
  }
  if (actions.finish) {
    items.push({
      key: 'finish',
      icon: 'paperclip',
      color: 'green',
      label: isOwnReservation ? t('show.post.actions.finishOwn') : t('show.post.actions.finish'),
      onClick: () => setFinishOpen(true),
      className: 'finish',
    });
  }
  if (actions.unfinish) {
    items.push({
      key: 'unfinish',
      icon: 'eject',
      color: 'orange',
      label: t('show.post.actions.unfinish'),
      onClick: ask(t('show.post.actions.unfinish'), t('show.post.actions.unfinishBody'), unfinish, 'warning'),
    });
  }
  if (actions.approve)
    items.push({ key: 'check', icon: 'check', color: 'green', label: t('show.post.actions.approve'), onClick: run(approve) });
  if (actions.deleteRequest) {
    items.push({
      key: 'delete',
      icon: 'trash',
      color: 'red',
      label: t('show.post.actions.delete'),
      onClick: ask(t('show.post.actions.deleteRequest'), t('show.post.actions.cannotUndo'), deleteRequest),
    });
  }
  if (actions.unapprove) {
    items.push({
      key: 'unlock',
      icon: 'lock-open',
      color: 'orange',
      label: t('show.post.actions.removeApproval'),
      onClick: ask(t('show.post.actions.removeApproval'), t('show.post.actions.removeApprovalBody'), unapprove, 'warning'),
    });
  }
  const compact = items.length + 1 >= 3;

  return (
    <>
      {actions.reserve && (
        <div className="mt-2">
          <Button size="sm" color="primary" className="reserve-request" onClick={run(reserve)} disabled={busy}>
            <InlineIcon icon="user-plus" first />
            {t('show.post.actions.reserve')}
          </Button>
        </div>
      )}
      <div className="mt-2">
        <div className="d-flex flex-wrap gap-1">
          {items.map((item) =>
            compact ? (
              <IconButton
                key={item.key}
                icon={item.icon}
                color={item.color}
                title={item.label}
                className={item.className}
                onClick={item.onClick}
                disabled={busy}
              />
            ) : (
              <Button key={item.key} size="sm" color={item.color} className={item.className} onClick={item.onClick} disabled={busy}>
                <InlineIcon icon={item.icon} first />
                {item.label}
              </Button>
            )
          )}
          <PostShareButton postId={post.id} compact={compact} />
        </div>
        {error && (
          <Alert color="danger" fade={false} className="mt-2 mb-0 py-1" role="alert">
            {describeApiError(error)}
          </Alert>
        )}
      </div>
      {actions.edit && <PostEditDialog post={post} isOpen={editOpen} onClose={() => setEditOpen(false)} />}
      {actions.finish && <PostFinishDialog post={post} isOpen={finishOpen} onClose={() => setFinishOpen(false)} />}
    </>
  );
};
