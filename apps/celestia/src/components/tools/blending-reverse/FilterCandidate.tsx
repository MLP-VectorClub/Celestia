import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/BlendingReverse.module.scss';
import { Rgba } from 'src/utils/color';

interface PropTypes {
  /** The calculated filter, `null` until two valid pairs are entered */
  filter: Rgba | null;
  selected: boolean;
  onToggle: () => void;
}

/** The calculated filter; click it to use it for the preview */
export const FilterCandidate: FC<PropTypes> = ({ filter, selected, onToggle }) => {
  const t = useTranslations();
  if (!filter) return <p className="text-muted fst-italic mb-0">{t('tools.reverse.candidate.empty')}</p>;

  return (
    <button
      type="button"
      className={classNames(styles.candidate, { [styles.selected]: selected })}
      aria-pressed={selected}
      onClick={onToggle}
      title={t('tools.reverse.candidate.hint')}
    >
      <span
        className={styles.candidatePreview}
        style={{ backgroundColor: `rgba(${filter.red}, ${filter.green}, ${filter.blue}, ${filter.alpha})` }}
      />
      <span className={styles.candidateValues}>
        <span>
          <strong>{t('tools.reverse.candidate.red')}</strong> <span className={styles.red}>{filter.red}</span>
        </span>
        <span>
          <strong>{t('tools.reverse.candidate.green')}</strong> <span className={styles.green}>{filter.green}</span>
        </span>
        <span>
          <strong>{t('tools.reverse.candidate.blue')}</strong> <span className={styles.blue}>{filter.blue}</span>
        </span>
        <span>
          <strong>{t('tools.reverse.candidate.alpha')}</strong> {Math.round(filter.alpha * 100)}%
        </span>
      </span>
    </button>
  );
};
