import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import styles from 'modules/PickerToolbar.module.scss';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { ColorField } from 'src/components/tools/shared/ColorField';
import { parseColor, rgbToHex } from 'src/utils/color';
import { Pixel, toCssColor } from 'src/utils/picker/pixels';

interface PropTypes {
  /** `null` while no image is open */
  color: Pixel | null;
  onChange: (color: Pixel) => void;
}

/** Button showing the color the picking areas of this image are drawn with, opens a dialog to change it */
export const AreaColorControl: FC<PropTypes> = ({ color, onChange }) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState('');
  const [opacity, setOpacity] = useState(50);
  useEffect(() => {
    if (open && color) {
      setHex(rgbToHex(color));
      setOpacity(Math.round(color.alpha * 100));
    }
  }, [open, color]);

  const parsed = parseColor(hex);

  return (
    <>
      <button
        type="button"
        className={styles.button}
        disabled={color === null}
        data-hint={t('picker.areaColor.hint')}
        onClick={() => setOpen(true)}
      >
        <span className={styles.areaColorSwatch} style={color ? { backgroundColor: toCssColor(color) } : undefined} />
        {t('picker.areaColor.button')}
      </button>
      <FormDialog
        title={t('picker.areaColor.title')}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={() => {
          if (!parsed) return;
          onChange({ ...parsed, alpha: opacity / 100 });
          setOpen(false);
        }}
        submitLabel={t('picker.common.set')}
      >
        <FormGroup>
          <Label for="area-color-hex">{t('picker.areaColor.color')}</Label>
          <ColorField id="area-color-hex" label={t('picker.areaColor.title')} value={hex} onChange={setHex} />
        </FormGroup>
        <FormGroup>
          <Label for="area-color-opacity">{t('picker.areaColor.opacity')}</Label>
          <Input
            id="area-color-opacity"
            type="number"
            min={0}
            max={100}
            step={1}
            value={opacity}
            onChange={(e) => setOpacity(Math.min(100, Math.max(0, Math.round(Number(e.target.value)) || 0)))}
          />
        </FormGroup>
      </FormDialog>
    </>
  );
};
