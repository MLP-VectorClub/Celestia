import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';

import styles from 'modules/PickerToolbar.module.scss';
import { MAX_AREA_SIZE, MIN_AREA_SIZE, clampAreaSize } from 'src/utils/picker/areas';

interface PropTypes {
  size: number | null;
  onChange: (size: number) => void;
}

/** Size of newly placed picking areas, 1–400 px. Buttons step by 5, with Ctrl or Cmd by 1 */
export const SizeControls: FC<PropTypes> = ({ size, onChange }) => {
  const t = useTranslations();
  const shown = size === null ? '' : String(size);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);

  const commit = () => {
    const parsed = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(parsed)) setDraft(shown);
    else onChange(clampAreaSize(parsed));
  };

  return (
    <div className={styles.group} role="group" aria-label={t('picker.size.controls')}>
      <button
        type="button"
        className={styles.button}
        disabled={size === null || size <= MIN_AREA_SIZE}
        aria-label={t('picker.size.decrease')}
        data-hint={t('picker.size.decreaseHint')}
        onClick={(e) => size !== null && onChange(clampAreaSize(size - (e.ctrlKey || e.metaKey ? 1 : 5)))}
      >
        −
      </button>
      <input
        className={styles.sizeInput}
        aria-label={t('picker.size.label')}
        data-hint={t('picker.size.hint')}
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
      <span className={styles.unit}>{t('picker.size.unit')}</span>
      <button
        type="button"
        className={styles.button}
        disabled={size === null || size >= MAX_AREA_SIZE}
        aria-label={t('picker.size.increase')}
        data-hint={t('picker.size.increaseHint')}
        onClick={(e) => size !== null && onChange(clampAreaSize(size + (e.ctrlKey || e.metaKey ? 1 : 5)))}
      >
        +
      </button>
    </div>
  );
};
