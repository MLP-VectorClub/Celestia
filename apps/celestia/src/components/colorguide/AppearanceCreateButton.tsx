import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { GuideName } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { PATHS } from 'src/paths';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { UserAdminService } from 'src/services/user-admin';

interface PropTypes {
  /** The official guide the appearance is added to, personal guides when missing */
  guide?: GuideName;
  /** The owner of a personal guide the appearance is added to, for the address of the new page */
  ownerId?: number;
  /** What the new appearance is, in the label of the button */
  kind: string;
}

/** The button and dialog that create an appearance (`POST /appearances`) and go to its page */
export const AppearanceCreateButton: FC<PropTypes> = ({ guide, ownerId, kind }) => {
  const t = useTranslations();
  const { push } = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [template, setTemplate] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const { confirm } = useDialog();

  // Like the old site, a personal guide first checks that there is a free slot, and says so when there is not, before the form opens
  const checkSlots = useApiMutation(() => UserAdminService.checkSlots(ownerId as number), { onSuccess: () => setOpen(true) });

  const create = useApiMutation(
    () =>
      AppearanceEditService.create({
        label: label.trim(),
        notes: notes.trim() || null,
        ...(guide ? { guide } : {}),
        // Flags are sent as 1/0, see AccountService
        template: Number(template) as unknown as boolean,
        private: Number(isPrivate) as unknown as boolean,
      }),
    {
      onSuccess: (data) => {
        void queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('/appearances') });
        setOpen(false);
        setLabel('');
        setNotes('');
        setTemplate(false);
        setIsPrivate(false);
        if (data.id) void push(PATHS.APPEARANCE({ id: data.id, label: label.trim(), guide: guide ?? null, ownerId }));
      },
    }
  );
  const errors = fieldErrors(create.error);
  const error = create.error && Object.keys(errors).length === 0 ? describeApiError(create.error) : null;

  return (
    <>
      <Button
        id="new-appearance-btn"
        data-testid="create-appearance-btn"
        color="success"
        size="sm"
        onClick={() =>
          ownerId === undefined
            ? setOpen(true)
            : checkSlots.mutate(undefined as never, {
                onError: (e) =>
                  void confirm({
                    title: t('colorGuide.create.noSlotsTitle'),
                    body: describeApiError(e),
                    confirmLabel: t('common.actions.close'),
                  }),
              })
        }
        disabled={checkSlots.isPending}
      >
        <InlineIcon icon="plus" first />
        {t('colorGuide.guide.addNew', { kind })}
      </Button>
      <FormDialog
        title={t('colorGuide.create.title', { kind })}
        isOpen={open}
        onClose={() => {
          create.reset();
          setOpen(false);
        }}
        onSubmit={() => label.trim().length >= 2 && create.mutate()}
        submitLabel={t('colorGuide.create.submit')}
        busy={create.isPending}
        error={error ?? errors.label ?? null}
      >
        <FormGroup>
          <Label for="new-appearance-label">{t('colorGuide.edit.meta.name')}</Label>
          <Input
            id="new-appearance-label"
            data-testid="form-label-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            minLength={2}
            maxLength={70}
            required
            autoFocus
            invalid={Boolean(errors.label)}
          />
          <FormText>{t('colorGuide.create.nameHelp')}</FormText>
        </FormGroup>
        <FormGroup>
          <Label for="new-appearance-notes">{t('colorGuide.edit.meta.notes')}</Label>
          <Input
            id="new-appearance-notes"
            type="textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
          />
        </FormGroup>
        <FormGroup check>
          <Input id="new-appearance-private" type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          <Label for="new-appearance-private" check>
            {t(guide ? 'colorGuide.create.privateStaff' : 'colorGuide.create.private')}
          </Label>
        </FormGroup>
        <FormGroup check>
          <Input id="new-appearance-template" type="checkbox" checked={template} onChange={(e) => setTemplate(e.target.checked)} />
          <Label for="new-appearance-template" check>
            {t('colorGuide.create.template')}
          </Label>
        </FormGroup>
      </FormDialog>
    </>
  );
};
