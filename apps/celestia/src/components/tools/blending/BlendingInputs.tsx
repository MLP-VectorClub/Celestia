import { FC } from 'react';

import styles from 'modules/Blending.module.scss';
import { ColorField } from 'src/components/tools/blending/ColorField';
import { BlendingField } from 'src/components/tools/blending/useBlending';

interface PropTypes {
  values: Record<BlendingField, string>;
  onChange: (field: BlendingField, value: string) => void;
  onRequestRgb: (field: BlendingField) => void;
}

const ROWS: Array<[BlendingField, BlendingField, string, string]> = [
  ['bg1', 'blend1', 'First background', 'Blended over the first background'],
  ['bg2', 'blend2', 'Second background', 'Blended over the second background'],
];

/** The 2×2 grid of backgrounds and the colors they produced */
export const BlendingInputs: FC<PropTypes> = ({ values, onChange, onRequestRgb }) => (
  <table className={styles.inputs}>
    <thead>
      <tr>
        <th>Background</th>
        <th>Blended color</th>
      </tr>
    </thead>
    <tbody>
      {ROWS.map(([bg, blend, bgLabel, blendLabel]) => (
        <tr key={bg}>
          {[
            [bg, bgLabel],
            [blend, blendLabel],
          ].map(([field, label]) => (
            <td key={field}>
              <ColorField
                id={`blending-${field}`}
                label={label}
                value={values[field as BlendingField]}
                onChange={(v) => onChange(field as BlendingField, v)}
                onRequestRgb={() => onRequestRgb(field as BlendingField)}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
