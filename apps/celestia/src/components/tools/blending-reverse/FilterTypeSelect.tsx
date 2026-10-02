import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Input } from 'reactstrap';

import { FilterType } from 'src/utils/color';

export const FilterTypeSelect: FC<{ value: FilterType; onChange: (value: FilterType) => void }> = ({ value, onChange }) => {
  const t = useTranslations();
  return (
    <Input type="select" aria-label={t('tools.reverse.filterType')} value={value} onChange={(e) => onChange(e.target.value as FilterType)}>
      <option value="normal">{t('tools.reverse.normal')}</option>
      <option value="multiply">{t('tools.reverse.multiply')}</option>
    </Input>
  );
};
