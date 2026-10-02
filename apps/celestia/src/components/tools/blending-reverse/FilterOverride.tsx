import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { ColorField } from 'src/components/tools/shared/ColorField';

export interface OverrideState {
  enabled: boolean;
  color: string;
  /** 0–100 */
  opacity: number;
}

/** Lets the user type the filter instead of using the calculated one */
export const FilterOverride: FC<{ value: OverrideState; onChange: (value: OverrideState) => void }> = ({ value, onChange }) => {
  const t = useTranslations();
  return (
    <div className="d-flex flex-wrap align-items-center gap-3">
      <FormGroup check className="mb-0">
        <Input
          id="override-enabled"
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
        />
        <Label for="override-enabled" check>
          {t('tools.reverse.enable')}
        </Label>
      </FormGroup>
      <ColorField
        id="override-color"
        label={t('tools.reverse.overrideColor')}
        value={value.color}
        onChange={(color) => onChange({ ...value, color })}
      />
      <div className="d-flex align-items-center gap-1">
        <Input
          aria-label={t('tools.reverse.overrideOpacity')}
          type="number"
          min={0}
          max={100}
          step={1}
          style={{ width: '5rem' }}
          value={value.opacity}
          onChange={(e) => onChange({ ...value, opacity: Math.min(100, Math.max(0, Math.round(Number(e.target.value)) || 0)) })}
        />
        %
      </div>
    </div>
  );
};
