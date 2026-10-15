import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { ColorField } from 'src/components/tools/shared/ColorField';
import { parseColor, rgbToHex } from 'src/utils/color';
import { Pixel } from 'src/utils/picker/pixels';

interface PropTypes {
  /** Color of the picking areas of the image being edited, the dialog is closed while this is `null` */
  color: Pixel | null;
  onClose: () => void;
  onChange: (color: Pixel) => void;
}

/** Dialog changing the color the picking areas of an image are drawn with, opened from the swatch on the image's tab */
export const AreaColorDialog: FC<PropTypes> = ({ color, onClose, onChange }) => {
  const t = useTranslations();
  const [hex, setHex] = useState('');
  const [opacity, setOpacity] = useState(50);
  useEffect(() => {
    if (color) {
      setHex(rgbToHex(color));
      setOpacity(Math.round(color.alpha * 100));
    }
  }, [color]);

  const parsed = parseColor(hex);

  return (
    <FormDialog
      title={t('picker.areaColor.title')}
      isOpen={color !== null}
      onClose={onClose}
      onSubmit={() => {
        if (!parsed) return;
        onChange({ ...parsed, alpha: opacity / 100 });
        onClose();
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
  );
};
