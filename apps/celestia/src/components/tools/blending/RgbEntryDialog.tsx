import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import styles from 'modules/Blending.module.scss';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { parseColor, rgbToHex } from 'src/utils/color';

interface PropTypes {
  /** The color to start from, the dialog is closed while this is `null` */
  initial: string | null;
  onClose: () => void;
  onSubmit: (hex: string) => void;
}

const CHANNELS = ['red', 'green', 'blue'] as const;

/** Enter a color as three 0–255 numbers instead of a hex code */
export const RgbEntryDialog: FC<PropTypes> = ({ initial, onClose, onSubmit }) => {
  const t = useTranslations();
  const [channels, setChannels] = useState({ red: 0, green: 0, blue: 0 });
  useEffect(() => {
    if (initial !== null) setChannels(parseColor(initial) ?? { red: 0, green: 0, blue: 0 });
  }, [initial]);

  const set = (key: keyof typeof channels, value: string) =>
    setChannels((all) => ({ ...all, [key]: Math.min(255, Math.max(0, Math.round(Number(value)) || 0)) }));

  return (
    <FormDialog
      title={t('tools.blending.rgbTitle')}
      isOpen={initial !== null}
      onClose={onClose}
      onSubmit={() => {
        onSubmit(rgbToHex(channels));
        onClose();
      }}
      submitLabel={t('tools.blending.set')}
    >
      <div className="d-flex gap-2">
        {CHANNELS.map((key) => (
          <FormGroup key={key} className="flex-fill">
            <Label for={`rgb-${key}`}>{t(`tools.blending.${key}`)}</Label>
            <Input
              id={`rgb-${key}`}
              type="number"
              min={0}
              max={255}
              step={1}
              value={channels[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </FormGroup>
        ))}
      </div>
      <div className={styles.dialogPreview} style={{ backgroundColor: rgbToHex(channels) }} />
    </FormDialog>
  );
};
