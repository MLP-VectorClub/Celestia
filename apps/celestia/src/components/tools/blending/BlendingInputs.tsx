import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/Blending.module.scss';
import { BlendingField } from 'src/components/tools/blending/useBlending';
import { ColorField } from 'src/components/tools/shared/ColorField';

interface PropTypes {
  values: Record<BlendingField, string>;
  onChange: (field: BlendingField, value: string) => void;
  onRequestRgb: (field: BlendingField) => void;
}

const ROWS: Array<[BlendingField, BlendingField, 'first' | 'second']> = [
  ['bg1', 'blend1', 'first'],
  ['bg2', 'blend2', 'second'],
];

/** The 2×2 grid of backgrounds and the colors they produced */
export const BlendingInputs: FC<PropTypes> = ({ values, onChange, onRequestRgb }) => {
  const t = useTranslations();
  return (
    <table className={styles.inputs}>
      <thead>
        <tr>
          <th>{t('tools.blending.background')}</th>
          <th>{t('tools.blending.blendedColor')}</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map(([bg, blend, which]) => (
          <tr key={bg}>
            {[
              [bg, t(`tools.blending.${which}Background`)],
              [blend, t(`tools.blending.${which}Blended`)],
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
};
