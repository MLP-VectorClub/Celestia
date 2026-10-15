import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { PostImageField } from 'src/components/show/PostImageField';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { CreatePostBody, PostService } from 'src/services/posts';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  showId: number;
  kind: CreatePostBody['kind'];
  isOpen: boolean;
  onClose: () => void;
  /** Opens the form again, for "Make another" */
  onMakeAnother?: () => void;
}

export const PostCreateDialog: FC<PropTypes> = ({ showId, kind, isOpen, onClose, onMakeAnother }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const [imageUrl, setImageUrl] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<NonNullable<CreatePostBody['type']>>('chr');

  const create = useApiMutation(
    () =>
      PostService.create({
        kind,
        showId,
        imageUrl: imageUrl.trim(),
        label: label.trim() || undefined,
        type: kind === 'request' ? type : undefined,
      }),
    {
      invalidate: [[ENDPOINTS.POSTS({ showId, kind })]],
      onSuccess: (post) => {
        setImageUrl('');
        setLabel('');
        onClose();
        // Like the old site: offer a jump to the new post or a fresh form
        void confirm({
          title: t(kind === 'request' ? 'show.post.create.postedRequest' : 'show.post.create.postedReservation'),
          body: t('show.post.create.postedBody'),
          confirmLabel: t('show.post.create.view'),
          cancelLabel: t('show.post.create.makeAnother'),
        }).then((view) => {
          if (view) window.location.hash = `post-${post.id}`;
          else onMakeAnother?.();
        });
      },
    }
  );

  const errors = fieldErrors(create.error);
  const handledFields = ['imageUrl', 'label', 'type'];
  const generalError = create.error && !handledFields.some((f) => errors[f]) ? describeApiError(create.error) : null;
  const isRequest = kind === 'request';

  return (
    <FormDialog
      title={isRequest ? t('show.post.create.titleRequest') : t('show.post.create.titleReservation')}
      isOpen={isOpen}
      onClose={() => {
        create.reset();
        onClose();
      }}
      onSubmit={() => create.mutate()}
      submitLabel={isRequest ? t('show.post.create.submitRequest') : t('show.post.create.submitReservation')}
      busy={create.isPending}
      error={generalError}
    >
      <PostImageField
        id={`new-${kind}-url`}
        value={imageUrl}
        onChange={setImageUrl}
        error={errors.imageUrl}
        // The title of a deviation makes a decent default description
        onChecked={(data) => data.title && label === '' && setLabel(data.title)}
        autoFocus
      />
      <FormGroup>
        <Label for={`new-${kind}-label`}>{t('show.post.fields.description')}</Label>
        <Input
          id={`new-${kind}-label`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          invalid={Boolean(errors.label)}
          maxLength={255}
          required={isRequest}
        />
        {errors.label && <div className="invalid-feedback d-block">{errors.label}</div>}
      </FormGroup>
      {isRequest && (
        <FormGroup>
          <Label for={`new-${kind}-type`}>{t('show.post.fields.requestType')}</Label>
          <Input
            id={`new-${kind}-type`}
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
    </FormDialog>
  );
};
