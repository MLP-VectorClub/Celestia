import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { ColorField } from 'src/components/tools/shared/ColorField';

export interface OverlayState {
  show: boolean;
  color: string;
}

/** Highlight color for pixels where the filter cannot be undone cleanly */
export const OverlayControls: FC<{ value: OverlayState; onChange: (value: OverlayState) => void }> = ({ value, onChange }) => {
  const t = useTranslations();
  return (
    <div className="d-flex flex-wrap align-items-center gap-3">
      <FormGroup check className="mb-0">
        <Input id="overlay-show" type="checkbox" checked={value.show} onChange={(e) => onChange({ ...value, show: e.target.checked })} />
        <Label for="overlay-show" check>
          {t('tools.reverse.showOverlay')}
        </Label>
      </FormGroup>
      <ColorField
        id="overlay-color"
        label={t('tools.reverse.overlayColor')}
        value={value.color}
        onChange={(color) => onChange({ ...value, color })}
      />
    </div>
  );
};
