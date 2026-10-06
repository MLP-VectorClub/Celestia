import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { DetailedAppearance } from '@mlp-vectorclub/api-types';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, useApiMutation } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  appearance: Pick<DetailedAppearance, 'id' | 'label' | 'guide'>;
  isOpen: boolean;
  onClose: () => void;
}

type Colors = '' | 'color_hex' | 'color_all' | 'all';

/** The old editor's "Selective wipe": choose which parts of an appearance to clear (`DELETE /appearances/{id}/contents`), asked once more before anything goes */
export const AppearanceWipeDialog: FC<PropTypes> = ({ appearance, isOpen, onClose }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const [colors, setColors] = useState<Colors>('');
  const [flags, setFlags] = useState({ wipeNotes: false, wipeSprite: false, wipeTags: false, mkpriv: false, resetPrivKey: false });
  const [nothingChosen, setNothingChosen] = useState(false);
  const official = appearance.guide !== null;

  const wipe = useApiMutation(
    () =>
      AppearanceEditService.clear(appearance.id, {
        ...(colors ? { wipeColors: colors } : {}),
        // Flags are sent as 1/0, see AccountService
        ...Object.fromEntries(
          Object.entries(flags)
            .filter(([, on]) => on)
            .map(([name]) => [name, 1])
        ),
      }),
    {
      invalidate: [[ENDPOINTS.APPEARANCE({ id: appearance.id })]],
      onSuccess: () => {
        setColors('');
        setFlags({ wipeNotes: false, wipeSprite: false, wipeTags: false, mkpriv: false, resetPrivKey: false });
        onClose();
      },
    }
  );

  const submit = async () => {
    if (!colors && !Object.values(flags).some(Boolean)) {
      setNothingChosen(true);
      return;
    }
    setNothingChosen(false);
    if (
      await confirm({
        title: t('colorGuide.edit.wipe.confirmTitle'),
        body: t('colorGuide.edit.wipe.confirmBody'),
        color: 'danger',
        confirmLabel: t('colorGuide.edit.wipe.confirm'),
      })
    ) {
      wipe.mutate();
    }
  };

  const flag = (name: keyof typeof flags, label: string) => (
    <FormGroup check key={name}>
      <Input
        id={`wipe-${appearance.id}-${name}`}
        name={name}
        type="checkbox"
        checked={flags[name]}
        onChange={(e) => setFlags({ ...flags, [name]: e.target.checked })}
      />
      <Label for={`wipe-${appearance.id}-${name}`} check>
        {label}
      </Label>
    </FormGroup>
  );

  return (
    <FormDialog
      title={t('colorGuide.edit.wipe.title', { label: appearance.label })}
      isOpen={isOpen}
      onClose={() => {
        wipe.reset();
        setNothingChosen(false);
        onClose();
      }}
      onSubmit={() => void submit()}
      submitLabel={t('colorGuide.edit.wipe.submit')}
      submitTestId="dialog-btn-wipe"
      busy={wipe.isPending}
      error={wipe.error ? describeApiError(wipe.error) : nothingChosen ? t('colorGuide.edit.wipe.nothing') : null}
    >
      <p>{t('colorGuide.edit.wipe.intro')}</p>
      <FormGroup tag="fieldset">
        <legend className="h6">{t('colorGuide.edit.wipe.colorGroups')}</legend>
        {(
          [
            ['', 'nothing'],
            ['color_hex', 'hex'],
            ['color_all', 'colors'],
            ['all', 'groups'],
          ] as const
        ).map(([value, key]) => (
          <FormGroup check inline key={value || 'nothing'}>
            <Input
              id={`wipe-${appearance.id}-colors-${key}`}
              name="wipeColors"
              type="radio"
              checked={colors === value}
              onChange={() => setColors(value)}
            />
            <Label for={`wipe-${appearance.id}-colors-${key}`} check>
              {t(`colorGuide.edit.wipe.colors.${key}`)}
            </Label>
          </FormGroup>
        ))}
      </FormGroup>
      {flag('wipeNotes', t('colorGuide.edit.wipe.notes'))}
      {flag('wipeSprite', t('colorGuide.edit.wipe.sprite'))}
      {official && flag('wipeTags', t('colorGuide.edit.wipe.tags'))}
      {flag('mkpriv', t('colorGuide.edit.wipe.makePrivate'))}
      {flag('resetPrivKey', t('colorGuide.edit.wipe.resetKey'))}
    </FormDialog>
  );
};
