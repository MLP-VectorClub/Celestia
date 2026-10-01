import Image from 'next/image';
import { FC, useState } from 'react';
import { Button, FormGroup, Input, InputGroup, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { CreatePostBody, PostService } from 'src/services/posts';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  showId: number;
  kind: CreatePostBody['kind'];
  isOpen: boolean;
  onClose: () => void;
}

export const PostCreateDialog: FC<PropTypes> = ({ showId, kind, isOpen, onClose }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<NonNullable<CreatePostBody['type']>>('chr');

  const check = useApiMutation((url: string) => PostService.checkImage(url), {
    // The title of a deviation makes a decent default description
    onSuccess: (data) => {
      if (data.title && label === '') setLabel(data.title);
    },
  });
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
      onSuccess: () => {
        setImageUrl('');
        setLabel('');
        check.reset();
        onClose();
      },
    }
  );

  const errors = fieldErrors(create.error);
  const handledFields = ['imageUrl', 'label', 'type'];
  const generalError = create.error && !handledFields.some((f) => errors[f]) ? describeApiError(create.error) : null;
  const isRequest = kind === 'request';

  return (
    <FormDialog
      title={isRequest ? 'Add a request' : 'Add a reservation'}
      isOpen={isOpen}
      onClose={() => {
        create.reset();
        onClose();
      }}
      onSubmit={() => create.mutate()}
      submitLabel={isRequest ? 'Submit request' : 'Add reservation'}
      busy={create.isPending}
      error={generalError}
    >
      <FormGroup>
        <Label for={`new-${kind}-url`}>Image link</Label>
        <InputGroup>
          <Input
            id={`new-${kind}-url`}
            type="url"
            placeholder="https://www.deviantart.com/…"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              check.reset();
            }}
            onBlur={() => imageUrl.trim() && !check.isPending && !check.data && check.mutate(imageUrl.trim())}
            invalid={Boolean(errors.imageUrl) || Boolean(check.error)}
            autoFocus
            required
          />
          <Button type="button" outline onClick={() => check.mutate(imageUrl.trim())} disabled={!imageUrl.trim() || check.isPending}>
            Check
          </Button>
        </InputGroup>
        {(errors.imageUrl || check.error) && (
          <div className="invalid-feedback d-block">{errors.imageUrl ?? (check.error && describeApiError(check.error))}</div>
        )}
        {check.data && (
          <Image
            src={check.data.preview}
            alt="Preview"
            width={160}
            height={120}
            unoptimized
            className="mt-2"
            style={{ objectFit: 'cover' }}
          />
        )}
      </FormGroup>
      <FormGroup>
        <Label for={`new-${kind}-label`}>Description</Label>
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
          <Label for={`new-${kind}-type`}>What is requested</Label>
          <Input
            id={`new-${kind}-type`}
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
