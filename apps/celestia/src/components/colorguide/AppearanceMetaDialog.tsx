import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';

import { DetailedAppearance } from '@mlp-vectorclub/api-types';
import { AppearanceWipeDialog } from 'src/components/colorguide/AppearanceWipeDialog';
import InlineIcon from 'src/components/shared/InlineIcon';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  appearance: Pick<DetailedAppearance, 'id' | 'label' | 'guide'>;
  isOpen: boolean;
  onClose: () => void;
}

/** Edits the label, notes and visibility of an appearance (`GET`/`PUT /appearances/{id}`) */
export const AppearanceMetaDialog: FC<PropTypes> = ({ appearance, isOpen, onClose }) => {
  const t = useTranslations();
  const [label, setLabel] = useState(appearance.label);
  const [notes, setNotes] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);

  // The raw (editable) notes are not part of the public appearance, they come from the metadata endpoint
  const load = useApiMutation(() => AppearanceEditService.getMetadata(appearance.id), {
    onSuccess: (data) => {
      setNotes(data.notes ?? '');
      setIsPrivate(Boolean(data.private));
      setLoaded(true);
    },
  });
  useEffect(() => {
    if (isOpen && !loaded && !load.isPending) {
      setLabel(appearance.label);
      load.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loaded]);

  const save = useApiMutation(
    () =>
      AppearanceEditService.update(appearance.id, {
        label: label.trim(),
        notes: notes.trim() || null,
        // Flags are sent as 1/0, see AccountService
        private: Number(isPrivate) as unknown as boolean,
        guide: appearance.guide,
      }),
    {
      invalidate: [[ENDPOINTS.APPEARANCE({ id: appearance.id })]],
      onSuccess: () => {
        setLoaded(false);
        onClose();
      },
    }
  );

  const errors = fieldErrors(save.error);
  const error = save.error ?? load.error;

  return (
    <FormDialog
      title={t('colorGuide.edit.meta.title')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        setLoaded(false);
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={t('colorGuide.edit.common.save')}
      busy={save.isPending || load.isPending}
      error={error && !errors.label && !errors.notes ? describeApiError(error) : null}
    >
      <FormGroup>
        <Label for={`meta-label-${appearance.id}`}>{t('colorGuide.edit.meta.name')}</Label>
        <Input
          id={`meta-label-${appearance.id}`}
          data-testid="form-label-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={load.isPending}
          invalid={Boolean(errors.label)}
          maxLength={70}
          required
        />
        {errors.label && <div className="invalid-feedback d-block">{errors.label}</div>}
      </FormGroup>
      <FormGroup>
        <Label for={`meta-notes-${appearance.id}`}>{t('colorGuide.edit.meta.notes')}</Label>
        <Input
          id={`meta-notes-${appearance.id}`}
          type="textarea"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={load.isPending}
          invalid={Boolean(errors.notes)}
        />
        {errors.notes && <div className="invalid-feedback d-block">{errors.notes}</div>}
      </FormGroup>
      <FormGroup check>
        <Input id={`meta-private-${appearance.id}`} type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
        <Label for={`meta-private-${appearance.id}`} check>
          {t('colorGuide.edit.meta.private')}
        </Label>
      </FormGroup>
      <div className="text-center mt-3">
        <Button type="button" color="red" size="sm" className="selective-wipe" onClick={() => setWipeOpen(true)}>
          <InlineIcon icon="eraser" first />
          {t('colorGuide.edit.meta.selectiveWipe')}
        </Button>
      </div>
      <AppearanceWipeDialog appearance={appearance} isOpen={wipeOpen} onClose={() => setWipeOpen(false)} />
    </FormDialog>
  );
};
