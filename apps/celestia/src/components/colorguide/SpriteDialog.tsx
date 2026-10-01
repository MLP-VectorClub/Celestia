import { FC, useState } from 'react';
import { Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, useApiMutation, useConfig } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  appearanceId: number;
  hasSprite: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const SpriteDialog: FC<PropTypes> = ({ appearanceId, hasSprite, isOpen, onClose }) => {
  const { config } = useConfig();
  const [file, setFile] = useState<File | null>(null);
  const options = {
    invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]],
    onSuccess: () => {
      setFile(null);
      onClose();
    },
  };
  const upload = useApiMutation((f: File) => AppearanceEditService.uploadSprite(appearanceId, f), options);
  const remove = useApiMutation(() => AppearanceEditService.removeSprite(appearanceId), options);

  const error = upload.error ?? remove.error;

  return (
    <FormDialog
      title="Sprite"
      isOpen={isOpen}
      onClose={() => {
        upload.reset();
        remove.reset();
        setFile(null);
        onClose();
      }}
      onSubmit={() => file && upload.mutate(file)}
      submitLabel="Upload"
      busy={upload.isPending || remove.isPending}
      error={error ? describeApiError(error) : null}
    >
      <FormGroup>
        <Label for={`sprite-${appearanceId}`}>PNG or JPEG image</Label>
        <Input
          id={`sprite-${appearanceId}`}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <FormText>{config ? `Up to ${config.maxUploadSize}.` : null} Replaces the current sprite.</FormText>
      </FormGroup>
      {hasSprite && (
        <Button type="button" color="danger" outline size="sm" onClick={() => remove.mutate()} disabled={remove.isPending}>
          Remove the current sprite
        </Button>
      )}
    </FormDialog>
  );
};
