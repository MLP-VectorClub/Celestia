import { FC, useEffect, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { PostItem } from '@mlp-vectorclub/api-types';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { PostService } from 'src/services/posts';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  post: PostItem;
  isOpen: boolean;
  onClose: () => void;
}

/** Change the description of a post and, for requests, what is requested. The developer-only date overrides are not offered */
export const PostEditDialog: FC<PropTypes> = ({ post, isOpen, onClose }) => {
  const [label, setLabel] = useState(post.label);
  const [type, setType] = useState<'chr' | 'obj' | 'bg'>(post.type ?? 'chr');
  useEffect(() => {
    if (isOpen) {
      setLabel(post.label);
      setType(post.type ?? 'chr');
    }
  }, [isOpen, post]);

  const isRequest = post.kind === 'request';
  const save = useApiMutation(() => PostService.update(post.id, { label: label.trim() || null, ...(isRequest ? { type } : {}) }), {
    invalidate: [[ENDPOINTS.POSTS({ showId: post.showId, kind: post.kind })]],
    onSuccess: onClose,
  });
  const errors = fieldErrors(save.error);

  return (
    <FormDialog
      title="Edit post"
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel="Save"
      busy={save.isPending}
      error={save.error && !errors.label && !errors.type ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for={`edit-${post.id}-label`}>Description</Label>
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
          <Label for={`edit-${post.id}-type`}>What is requested</Label>
          <Input
            id={`edit-${post.id}-type`}
            type="select"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            invalid={Boolean(errors.type)}
          >
            <option value="chr">Character</option>
            <option value="obj">Object</option>
            <option value="bg">Background</option>
          </Input>
          {errors.type && <div className="invalid-feedback d-block">{errors.type}</div>}
        </FormGroup>
      )}
    </FormDialog>
  );
};
