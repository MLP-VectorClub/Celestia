import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Input } from 'reactstrap';

/** How far past the valid range a restored color may be before its pixel is highlighted */
export const SensitivitySlider: FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => {
  const t = useTranslations();
  return (
    <div className="d-flex align-items-center gap-2">
      <Input
        type="range"
        min={0}
        max={255}
        step={1}
        aria-label={t('tools.reverse.sensitivity')}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output style={{ minWidth: '2.5rem' }}>{value}</output>
    </div>
  );
};
