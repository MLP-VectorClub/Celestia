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

export const PostFinishDialog: FC<PropTypes> = ({ post, isOpen, onClose }) => {
  const t = useTranslations();
  const [deviation, setDeviation] = useState('');
  const [allowOverwriteReserver, setAllowOverwriteReserver] = useState(false);

  const finish = useApiMutation(
    () => PostService.finish(post.id, { deviation: deviation.trim(), allowOverwriteReserver: allowOverwriteReserver || undefined }),
    {
      invalidate: [
        [ENDPOINTS.POSTS({ showId: post.showId, kind: 'request' })],
        [ENDPOINTS.POSTS({ showId: post.showId, kind: 'reservation' })],
      ],
      onSuccess: () => {
        setDeviation('');
        setAllowOverwriteReserver(false);
        onClose();
      },
    }
  );

  const error = finish.error;
  // The API says when the same request may be retried with the reserver overwritten
  const canRetryWithOverwrite = error?.type === UnifiedErrorResponseTypes.MESSAGE_ONLY && Boolean(error.details.retry);
  const deviationError = fieldErrors(error).deviation;

  return (
    <FormDialog
      title={t('show.post.actions.finish')}
      isOpen={isOpen}
      onClose={() => {
        finish.reset();
        onClose();
      }}
      onSubmit={() => finish.mutate()}
      submitLabel={t('show.post.finish.submit')}
      submitTestId="dialog-btn-finish"
      busy={finish.isPending}
      error={error && !deviationError ? describeApiError(error) : null}
    >
      <FormGroup>
        <Label for={`finish-${post.id}`}>{t('show.post.finish.link')}</Label>
        <Input
          id={`finish-${post.id}`}
          type="url"
          placeholder="https://www.deviantart.com/…"
          value={deviation}
          onChange={(e) => setDeviation(e.target.value)}
          invalid={Boolean(deviationError)}
          autoFocus
          required
        />
        {deviationError && <div className="invalid-feedback d-block">{deviationError}</div>}
      </FormGroup>
      {canRetryWithOverwrite && (
        <FormGroup check>
          <Input
            id={`overwrite-${post.id}`}
            type="checkbox"
            checked={allowOverwriteReserver}
            onChange={(e) => setAllowOverwriteReserver(e.target.checked)}
          />
          <Label for={`overwrite-${post.id}`} check>
            {t('show.post.finish.changeReserver')}
          </Label>
        </FormGroup>
      )}
    </FormDialog>
  );
};
