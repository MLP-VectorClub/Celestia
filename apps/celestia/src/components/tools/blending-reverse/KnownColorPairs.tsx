import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Button } from 'reactstrap';

import styles from 'modules/BlendingReverse.module.scss';
import { KnownPair } from 'src/components/tools/blending-reverse/useKnownColorPairs';
import { ColorField } from 'src/components/tools/shared/ColorField';

interface PropTypes {
  pairs: KnownPair[];
  onChange: (id: number, patch: Partial<Pick<KnownPair, 'original' | 'filtered'>>) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
}

/** Table of colors before and after the filter; at least two valid rows are needed to calculate the filter */
export const KnownColorPairs: FC<PropTypes> = ({ pairs, onChange, onAdd, onRemove }) => {
  const t = useTranslations();
  return (
    <table className={styles.pairs}>
      <thead>
        <tr>
          <th>{t('tools.reverse.original')}</th>
          <th>{t('tools.reverse.filtered')}</th>
          <td>
            <Button color="success" size="sm" onClick={onAdd} aria-label={t('tools.reverse.addPair')}>
              +
            </Button>
          </td>
        </tr>
      </thead>
      <tbody>
        {pairs.map((pair, i) => (
          <tr key={pair.id}>
            <td>
              <ColorField
                id={`pair-${pair.id}-original`}
                label={t('tools.reverse.originalColor', { n: i + 1 })}
                value={pair.original}
                onChange={(v) => onChange(pair.id, { original: v })}
              />
            </td>
            <td>
              <ColorField
                id={`pair-${pair.id}-filtered`}
                label={t('tools.reverse.filteredColorN', { n: i + 1 })}
                value={pair.filtered}
                onChange={(v) => onChange(pair.id, { filtered: v })}
              />
            </td>
            <td>
              <Button
                color="danger"
                size="sm"
                disabled={pairs.length <= 2}
                onClick={() => onRemove(pair.id)}
                aria-label={t('tools.reverse.removePair', { n: i + 1 })}
              >
                −
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
