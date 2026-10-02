import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { FULL_LEVELS, Levels, normalizeLevels } from 'src/utils/picker/levels';

interface PropTypes {
  /** The levels of the active image, the dialog is closed while this is `null` */
  levels: Levels | null;
  onClose: () => void;
  onSubmit: (levels: Levels) => void;
}

/**
 * Stretch the visible range of the active image. Only changes how it looks: the colors picking areas report always come from the original
 * pixels, which helps telling apart areas with noisy or ambiguous colors
 */
export const LevelsDialog: FC<PropTypes> = ({ levels, onClose, onSubmit }) => {
  const t = useTranslations();
  const [draft, setDraft] = useState<Levels>(FULL_LEVELS);
  useEffect(() => {
    if (levels) setDraft(levels);
  }, [levels]);

  const change = (patch: Partial<Levels>) => setDraft((current) => normalizeLevels({ ...current, ...patch }));

  return (
    <FormDialog
      title={t('picker.levels.title')}
      isOpen={levels !== null}
      onClose={onClose}
      onSubmit={() => {
        onSubmit(normalizeLevels(draft));
        onClose();
      }}
      submitLabel={t('picker.common.set')}
    >
      <p className="small text-muted">{t('picker.levels.explain')}</p>
      {(['low', 'high'] as const).map((key) => (
        <FormGroup key={key}>
          <Label for={`levels-${key}`}>{t(`picker.levels.${key}`)}</Label>
          <div className="d-flex align-items-center gap-2">
            <Input
              id={`levels-${key}`}
              type="range"
              min={0}
              max={255}
              step={1}
              value={draft[key]}
              onChange={(e) => change({ [key]: Number(e.target.value) })}
            />
            <Input
              aria-label={t(`picker.levels.${key}Value`)}
              type="number"
              min={0}
              max={255}
              step={1}
              style={{ width: '5rem' }}
              value={draft[key]}
              onChange={(e) => change({ [key]: Number(e.target.value) })}
            />
          </div>
        </FormGroup>
      ))}
      <Button type="button" color="link" size="sm" className="p-0" onClick={() => setDraft(FULL_LEVELS)}>
        {t('picker.levels.reset')}
      </Button>
    </FormDialog>
  );
};
