import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { Alert, Button } from 'reactstrap';

import { DetailedAppearance } from '@mlp-vectorclub/api-types';
import { AppearanceMetaDialog } from 'src/components/colorguide/AppearanceMetaDialog';
import { AppearanceRelationsDialog } from 'src/components/colorguide/AppearanceRelationsDialog';
import { AppearanceTagsDialog } from 'src/components/colorguide/AppearanceTagsDialog';
import { SpriteDialog } from 'src/components/colorguide/SpriteDialog';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, useApiMutation, useAuth, usePinnedAppearances } from 'src/hooks';
import { PATHS } from 'src/paths';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';

type Dialogs = 'meta' | 'tags' | 'sprite' | 'relations' | 'shows' | null;

/**
 * Editing controls of the appearance page. `canEdit` comes from the API, staff-only actions are additionally gated by role
 */
export const AppearanceEditActions: FC<{ appearance: DetailedAppearance }> = ({ appearance }) => {
  const { isStaff } = useAuth();
  const { confirm } = useDialog();
  const { push } = useRouter();
  const [open, setOpen] = useState<Dialogs>(null);

  const pinnable = isStaff && appearance.guide !== null;
  const pinned = usePinnedAppearances({ guide: pinnable ? appearance.guide : null });
  const isPinned = Boolean(pinned?.some((a) => a.id === appearance.id));

  const pinToggle = useApiMutation(
    () => (isPinned ? AppearanceEditService.unpin(appearance.id) : AppearanceEditService.pin(appearance.id)),
    {
      invalidate: [[ENDPOINTS.APPEARANCES_PINNED({ guide: appearance.guide as 'pony' | 'eqg' })]],
    }
  );
  const remove = useApiMutation(() => AppearanceEditService.remove(appearance.id), {
    onSuccess: () => void push(appearance.guide ? PATHS.GUIDE(appearance.guide) : PATHS.GUIDE_INDEX),
  });

  if (!appearance.canEdit) return null;

  const error = pinToggle.error ?? remove.error;
  return (
    <>
      <Button color="ui" size="sm" onClick={() => setOpen('meta')}>
        <InlineIcon icon="pencil-alt" first />
        Edit metadata
      </Button>
      <Button color="ui" size="sm" onClick={() => setOpen('tags')}>
        <InlineIcon icon="tags" first />
        Edit tags
      </Button>
      <Button color="ui" size="sm" onClick={() => setOpen('sprite')}>
        <InlineIcon icon="image" first />
        Sprite
      </Button>
      {appearance.guide !== null && (
        <Button color="ui" size="sm" onClick={() => setOpen('relations')}>
          <InlineIcon icon="link" first />
          Related
        </Button>
      )}
      {isStaff && (
        <Button color="ui" size="sm" onClick={() => setOpen('shows')}>
          <InlineIcon icon="video" first />
          Shows
        </Button>
      )}
      {pinnable && (
        <Button color="ui" size="sm" onClick={() => pinToggle.mutate()} disabled={pinToggle.isPending}>
          {isPinned ? 'Unpin' : 'Pin'}
        </Button>
      )}
      <Button
        color="danger"
        size="sm"
        disabled={remove.isPending}
        onClick={async () => {
          if (
            await confirm({
              title: 'Delete appearance',
              body: `“${appearance.label}” and all of its colors will be deleted. This cannot be undone.`,
              color: 'danger',
              confirmLabel: 'Delete',
            })
          ) {
            remove.mutate();
          }
        }}
      >
        <InlineIcon icon="trash" first />
        Delete appearance
      </Button>
      {error && (
        <Alert color="danger" fade={false} className="w-100 mt-2 mb-0" role="alert">
          {describeApiError(error)}
        </Alert>
      )}
      <AppearanceMetaDialog appearance={appearance} isOpen={open === 'meta'} onClose={() => setOpen(null)} />
      <AppearanceTagsDialog appearanceId={appearance.id} isOpen={open === 'tags'} onClose={() => setOpen(null)} />
      {appearance.guide !== null && (
        <AppearanceRelationsDialog
          appearanceId={appearance.id}
          kind="relations"
          isOpen={open === 'relations'}
          onClose={() => setOpen(null)}
        />
      )}
      {isStaff && (
        <AppearanceRelationsDialog appearanceId={appearance.id} kind="shows" isOpen={open === 'shows'} onClose={() => setOpen(null)} />
      )}
      <SpriteDialog
        appearanceId={appearance.id}
        hasSprite={Boolean(appearance.sprite)}
        isOpen={open === 'sprite'}
        onClose={() => setOpen(null)}
      />
    </>
  );
};
