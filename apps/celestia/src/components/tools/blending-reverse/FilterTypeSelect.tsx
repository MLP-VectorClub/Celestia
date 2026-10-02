import { FC } from 'react';
import { Input } from 'reactstrap';

import { FilterType } from 'src/utils/color';

export const FilterTypeSelect: FC<{ value: FilterType; onChange: (value: FilterType) => void }> = ({ value, onChange }) => (
  <Input type="select" aria-label="Filter type" value={value} onChange={(e) => onChange(e.target.value as FilterType)}>
    <option value="normal">Normal</option>
    <option value="multiply">Multiply</option>
  </Input>
);
