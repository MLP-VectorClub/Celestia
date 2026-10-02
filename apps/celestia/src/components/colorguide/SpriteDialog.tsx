import { useTranslations } from 'next-intl';
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
  const t = useTranslations();
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
      title={t('colorGuide.edit.sprite.title')}
      isOpen={isOpen}
      onClose={() => {
        upload.reset();
        remove.reset();
        setFile(null);
        onClose();
      }}
      onSubmit={() => file && upload.mutate(file)}
      submitLabel={t('colorGuide.edit.sprite.upload')}
      busy={upload.isPending || remove.isPending}
      error={error ? describeApiError(error) : null}
    >
      <FormGroup>
        <Label for={`sprite-${appearanceId}`}>{t('colorGuide.edit.sprite.image')}</Label>
        <Input
          id={`sprite-${appearanceId}`}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <FormText>
          {config ? `${t('colorGuide.edit.sprite.limit', { limit: config.maxUploadSize })} ` : ''}
          {t('colorGuide.edit.sprite.help')}
        </FormText>
      </FormGroup>
      {hasSprite && (
        <Button type="button" color="danger" outline size="sm" onClick={() => remove.mutate()} disabled={remove.isPending}>
          {t('colorGuide.edit.sprite.remove')}
        </Button>
      )}
    </FormDialog>
  );
};
