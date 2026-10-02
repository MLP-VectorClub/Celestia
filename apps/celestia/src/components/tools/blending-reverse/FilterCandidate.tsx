import classNames from 'classnames';
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
  if (!filter) return <p className="text-muted fst-italic mb-0">Enter at least two complete color pairs to calculate the filter.</p>;

  return (
    <button
      type="button"
      className={classNames(styles.candidate, { [styles.selected]: selected })}
      aria-pressed={selected}
      onClick={onToggle}
      title="Click to select & apply"
    >
      <span
        className={styles.candidatePreview}
        style={{ backgroundColor: `rgba(${filter.red}, ${filter.green}, ${filter.blue}, ${filter.alpha})` }}
      />
      <span className={styles.candidateValues}>
        <span>
          <strong>R:</strong> <span className={styles.red}>{filter.red}</span>
        </span>
        <span>
          <strong>G:</strong> <span className={styles.green}>{filter.green}</span>
        </span>
        <span>
          <strong>B:</strong> <span className={styles.blue}>{filter.blue}</span>
        </span>
        <span>
          <strong>A:</strong> {Math.round(filter.alpha * 100)}%
        </span>
      </span>
    </button>
  );
};
