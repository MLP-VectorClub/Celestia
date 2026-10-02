import { FC, useEffect, useState } from 'react';

import styles from 'modules/PickerToolbar.module.scss';
import { MAX_AREA_SIZE, MIN_AREA_SIZE, clampAreaSize } from 'src/utils/picker/areas';

interface PropTypes {
  size: number | null;
  onChange: (size: number) => void;
}

/** Size of newly placed picking areas, 1–400 px. Buttons step by 5, with Ctrl or Cmd by 1 */
export const SizeControls: FC<PropTypes> = ({ size, onChange }) => {
  const shown = size === null ? '' : String(size);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);

  const commit = () => {
    const parsed = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(parsed)) setDraft(shown);
    else onChange(clampAreaSize(parsed));
  };

  return (
    <div className={styles.group} role="group" aria-label="Picking area size controls">
      <button
        type="button"
        className={styles.button}
        disabled={size === null || size <= MIN_AREA_SIZE}
        aria-label="Decrease picking area size"
        title="Decrease picking area size (Down Arrow). Hold Ctrl to change in steps of 1 instead of 5."
        onClick={(e) => size !== null && onChange(clampAreaSize(size - (e.ctrlKey || e.metaKey ? 1 : 5)))}
      >
        −
      </button>
      <input
        className={styles.sizeInput}
        aria-label="Picking area size"
        title="Size of newly placed picking areas, between 1px and 400px"
        inputMode="numeric"
        disabled={size === null}
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setDraft(shown);
        }}
      />
      <span className={styles.unit}>px</span>
      <button
        type="button"
        className={styles.button}
        disabled={size === null || size >= MAX_AREA_SIZE}
        aria-label="Increase picking area size"
        title="Increase picking area size (Up Arrow). Hold Ctrl to change in steps of 1 instead of 5."
        onClick={(e) => size !== null && onChange(clampAreaSize(size + (e.ctrlKey || e.metaKey ? 1 : 5)))}
      >
        +
      </button>
    </div>
  );
};
