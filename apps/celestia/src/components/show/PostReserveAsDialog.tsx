import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { PostItem } from '@mlp-vectorclub/api-types';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { PostService } from 'src/services/posts';
import { UnifiedErrorResponseTypes } from 'src/types';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  post: PostItem;
  isOpen: boolean;
  onClose: () => void;
}

/** Developers only: reserve a request for another user (the old site's Shift+click on Reserve), by their DeviantArt name */
export const PostReserveAsDialog: FC<PropTypes> = ({ post, isOpen, onClose }) => {
  const t = useTranslations();
  const [name, setName] = useState('');
  const [anyway, setAnyway] = useState(false);

  const reserve = useApiMutation(() => PostService.reserve(post.id, { as: name.trim(), ...(anyway ? { screwit: true } : {}) }), {
    invalidate: [
      [ENDPOINTS.POSTS({ showId: post.showId, kind: 'request' })],
      [ENDPOINTS.POSTS({ showId: post.showId, kind: 'reservation' })],
    ],
    onSuccess: () => {
      setName('');
      setAnyway(false);
      onClose();
    },
  });

  const error = reserve.error;
  // The API says when the same request may be repeated for a user who is not allowed to reserve
  const canRetry = error?.type === UnifiedErrorResponseTypes.MESSAGE_ONLY && Boolean(error.details.retry);
  const nameError = fieldErrors(error).as;

  return (
    <FormDialog
      title={t('show.post.reserveAs.title')}
      isOpen={isOpen}
      onClose={() => {
        reserve.reset();
        onClose();
      }}
      onSubmit={() => reserve.mutate()}
      submitLabel={t('show.post.actions.reserve')}
      submitTestId="dialog-btn-reserve"
      busy={reserve.isPending}
      error={error && !nameError ? describeApiError(error) : null}
    >
      <FormGroup>
        <Label for={`reserve-as-${post.id}`}>{t('show.post.reserveAs.name')}</Label>
        <Input
          id={`reserve-as-${post.id}`}
          name="as"
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={Boolean(nameError)}
          autoFocus
          required
        />
        {nameError && <div className="invalid-feedback d-block">{nameError}</div>}
      </FormGroup>
      {canRetry && (
        <FormGroup check>
          <Input id={`reserve-anyway-${post.id}`} type="checkbox" checked={anyway} onChange={(e) => setAnyway(e.target.checked)} />
          <Label for={`reserve-anyway-${post.id}`} check>
            {t('show.post.reserveAs.anyway')}
          </Label>
        </FormGroup>
      )}
    </FormDialog>
  );
};
