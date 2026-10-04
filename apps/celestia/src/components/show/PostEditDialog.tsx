import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Alert, Button, FormGroup, Input, Label } from 'reactstrap';

import { PostItem } from '@mlp-vectorclub/api-types';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { PostImageField } from 'src/components/show/PostImageField';
import { describeApiError, fieldErrors, useApiMutation, useAuth } from 'src/hooks';
import { PostService } from 'src/services/posts';
import { ENDPOINTS } from 'src/utils';
import { getPostActions } from 'src/utils/post-actions';

interface PropTypes {
  post: PostItem;
  isOpen: boolean;
  onClose: () => void;
}

/** Change the description of a post and, for requests, what is requested. The developer-only date overrides are not offered */
export const PostEditDialog: FC<PropTypes> = ({ post, isOpen, onClose }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const actions = getPostActions(post, user);
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [label, setLabel] = useState(post.label);
  const [type, setType] = useState<'chr' | 'obj' | 'bg'>(post.type ?? 'chr');
  useEffect(() => {
    if (isOpen) {
      setLabel(post.label);
      setType(post.type ?? 'chr');
      setImageOpen(false);
      setImageUrl('');
    }
  }, [isOpen, post]);

  const isRequest = post.kind === 'request';
  const save = useApiMutation(() => PostService.update(post.id, { label: label.trim() || null, ...(isRequest ? { type } : {}) }), {
    invalidate: [[ENDPOINTS.POSTS({ showId: post.showId, kind: post.kind })]],
    onSuccess: onClose,
  });
  const errors = fieldErrors(save.error);

  const invalidate = [[ENDPOINTS.POSTS({ showId: post.showId, kind: post.kind })]];
  const unbreak = useApiMutation(() => PostService.unbreak(post.id), { invalidate, onSuccess: onClose });
  const changeImage = useApiMutation(() => PostService.changeImage(post.id, imageUrl.trim()), {
    invalidate,
    onSuccess: () => setImageUrl(''),
  });
  const imageErrors = fieldErrors(changeImage.error);

  return (
    <FormDialog
      title={t('show.post.edit.title')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={t('show.common.save')}
      busy={save.isPending}
      error={save.error && !errors.label && !errors.type ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for={`edit-${post.id}-label`}>{t('show.post.fields.description')}</Label>
        <Input
          id={`edit-${post.id}-label`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={255}
          invalid={Boolean(errors.label)}
          required={isRequest}
        />
        {errors.label && <div className="invalid-feedback d-block">{errors.label}</div>}
      </FormGroup>
      {isRequest && (
        <FormGroup>
          <Label for={`edit-${post.id}-type`}>{t('show.post.fields.requestType')}</Label>
          <Input
            id={`edit-${post.id}-type`}
            type="select"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            invalid={Boolean(errors.type)}
          >
            <option value="chr">{t('show.post.fields.chr')}</option>
            <option value="obj">{t('show.post.fields.obj')}</option>
            <option value="bg">{t('show.post.fields.bg')}</option>
          </Input>
          {errors.type && <div className="invalid-feedback d-block">{errors.type}</div>}
        </FormGroup>
      )}
      {actions.unbreak && (
        <FormGroup>
          <Button
            type="button"
            id="dialog-clear-broken-status"
            color="warning"
            size="sm"
            disabled={unbreak.isPending}
            onClick={() => unbreak.mutate()}
          >
            {t('show.post.edit.clearBroken')}
          </Button>
          {unbreak.error && <div className="invalid-feedback d-block">{describeApiError(unbreak.error)}</div>}
        </FormGroup>
      )}
      {actions.changeImage && (
        <FormGroup>
          <Button type="button" id="dialog-update-image" color="ui" size="sm" onClick={() => setImageOpen((open) => !open)}>
            {t('show.post.edit.updateImage')}
          </Button>
          {imageOpen && (
            <div id="img-update-form" className="mt-2">
              <PostImageField
                id={`edit-${post.id}-image`}
                label={t('show.post.image.newLink')}
                value={imageUrl}
                onChange={(value) => {
                  setImageUrl(value);
                  changeImage.reset();
                }}
                error={imageErrors.imageUrl}
                name="imageUrl"
              />
              <Button
                type="button"
                color="primary"
                size="sm"
                data-testid="dialog-btn-update"
                disabled={!imageUrl.trim() || changeImage.isPending}
                onClick={() => changeImage.mutate()}
              >
                {t('show.post.actions.changeImage')}
              </Button>
              {changeImage.error && !imageErrors.imageUrl && (
                <div className="invalid-feedback d-block">{describeApiError(changeImage.error)}</div>
              )}
              {changeImage.isSuccess && (
                <Alert color="success" fade={false} className="mt-2 mb-0 py-1" role="status">
                  {t('show.post.edit.imageUpdated')}
                </Alert>
              )}
            </div>
          )}
        </FormGroup>
      )}
    </FormDialog>
  );
};
