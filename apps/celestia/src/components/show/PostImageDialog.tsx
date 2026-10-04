import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';

import { PostItem } from '@mlp-vectorclub/api-types';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { PostImageField } from 'src/components/show/PostImageField';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { PostService } from 'src/services/posts';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  post: PostItem;
  isOpen: boolean;
  onClose: () => void;
}

/** Replace the image of a post with another link, the API checks that it is reachable */
export const PostImageDialog: FC<PropTypes> = ({ post, isOpen, onClose }) => {
  const t = useTranslations();
  const [imageUrl, setImageUrl] = useState('');
  const save = useApiMutation(() => PostService.changeImage(post.id, imageUrl.trim()), {
    invalidate: [[ENDPOINTS.POSTS({ showId: post.showId, kind: post.kind })]],
    onSuccess: () => {
      setImageUrl('');
      onClose();
    },
  });
  const errors = fieldErrors(save.error);

  return (
    <FormDialog
      title={t('show.post.actions.changeImage')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => imageUrl.trim() && save.mutate()}
      submitLabel={t('show.post.actions.changeImage')}
      submitTestId="dialog-btn-update"
      busy={save.isPending}
      error={save.error && !errors.imageUrl ? describeApiError(save.error) : null}
    >
      <PostImageField
        id={`image-${post.id}-url`}
        label={t('show.post.image.newLink')}
        value={imageUrl}
        onChange={setImageUrl}
        error={errors.imageUrl}
        autoFocus
        name="imageUrl"
      />
    </FormDialog>
  );
};
