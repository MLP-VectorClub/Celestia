import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { Alert, Button } from 'reactstrap';

import { DetailedAppearance } from '@mlp-vectorclub/api-types';
import { AppearanceMetaDialog } from 'src/components/colorguide/AppearanceMetaDialog';
import { AppearanceRelationsDialog } from 'src/components/colorguide/AppearanceRelationsDialog';
import { AppearanceTagsDialog } from 'src/components/colorguide/AppearanceTagsDialog';
import { CutieMarkDialog } from 'src/components/colorguide/CutieMarkDialog';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, useApiMutation, useAuth } from 'src/hooks';
import { PATHS } from 'src/paths';
import { AppearanceEditService } from 'src/services/appearance-edit';

/*
 * The editing controls of the appearance page. Like on the old site every one sits next to the part of the page it changes, so each is its own
 * component: a button and the dialog it opens. `canEdit` comes from the API, the staff-only ones are additionally gated by role.
 */

/** "Edit metadata" and "Delete appearance", in the row of buttons under the heading */
export const AppearanceHeaderActions: FC<{ appearance: DetailedAppearance }> = ({ appearance }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const { push } = useRouter();
  const [open, setOpen] = useState(false);
  const remove = useApiMutation(() => AppearanceEditService.remove(appearance.id), {
    onSuccess: () => void push(appearance.guide ? PATHS.GUIDE(appearance.guide) : PATHS.GUIDE_INDEX),
  });

  if (!appearance.canEdit) return null;

  return (
    <>
      <Button color="darkblue" onClick={() => setOpen(true)} data-testid="edit-appearance-btn">
        <InlineIcon icon="pencil-alt" first />
        {t('colorGuide.edit.actions.metadata')}
      </Button>
      <Button
        color="red"
        data-testid="delete-appearance-btn"
        disabled={remove.isPending}
        onClick={async () => {
          if (
            await confirm({
              title: t('colorGuide.edit.actions.delete'),
              body: t('colorGuide.edit.actions.deleteBody', { label: appearance.label }),
              color: 'danger',
              confirmLabel: t('colorGuide.edit.common.delete'),
            })
          ) {
            remove.mutate();
          }
        }}
      >
        <InlineIcon icon="trash" first />
        {t('colorGuide.edit.actions.delete')}
      </Button>
      {remove.error && (
        <Alert color="danger" fade={false} className="w-100 mt-2 mb-0" role="alert">
          {describeApiError(remove.error)}
        </Alert>
      )}
      <AppearanceMetaDialog appearance={appearance} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

/** "Edit tags" under the tags, staff only */
export const EditTagsButton: FC<{ appearanceId: number }> = ({ appearanceId }) => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  if (!isStaff) return null;
  return (
    <>
      <Button color="darkblue" id="edit-tags-btn" data-testid="edit-tags-btn" onClick={() => setOpen(true)}>
        <InlineIcon icon="pencil-alt" first />
        {t('colorGuide.edit.actions.tags')}
      </Button>
      <AppearanceTagsDialog appearanceId={appearanceId} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

/** "Edit relations" under "Featured in" (the shows the appearance is linked to) or under the related appearances, staff only */
export const EditRelationsButton: FC<{ appearanceId: number; kind: 'shows' | 'relations' }> = ({ appearanceId, kind }) => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  if (!isStaff) return null;
  return (
    <>
      <Button color="darkblue" className={kind === 'shows' ? 'edit-show-relations' : 'edit-appearance-relations'} onClick={() => setOpen(true)}>
        <InlineIcon icon="pencil-alt" first />
        {t('colorGuide.edit.actions.editRelations')}
      </Button>
      <AppearanceRelationsDialog appearanceId={appearanceId} kind={kind} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

/** Opens the cutie mark editor, next to the cutie marks */
export const EditCutieMarksButton: FC<{ appearance: DetailedAppearance }> = ({ appearance }) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  if (!appearance.canEdit) return null;
  return (
    <>
      <Button color="darkblue" onClick={() => setOpen(true)}>
        <InlineIcon icon="pencil-alt" first />
        {t('colorGuide.edit.actions.cutieMarks')}
      </Button>
      <CutieMarkDialog appearanceId={appearance.id} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};
