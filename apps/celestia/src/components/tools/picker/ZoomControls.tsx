import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';

import styles from 'modules/PickerPanels.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { formatZoom, parseZoomPercent } from 'src/utils/picker/viewport';

interface PropTypes {
  zoom: number | null;
  onStep: (direction: 1 | -1) => void;
  onFit: () => void;
  onOriginal: () => void;
  onZoomTo: (zoom: number) => void;
}

/** Zoom in/out, fit and original size as icon buttons, and a field to type any zoom between 0.4% and 3200% */
export const ZoomControls: FC<PropTypes> = ({ zoom, onStep, onFit, onOriginal, onZoomTo }) => {
  const t = useTranslations();
  const shown = zoom === null ? '' : formatZoom(zoom);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);

  const commit = () => {
    const parsed = parseZoomPercent(draft);
    if (parsed === null) setDraft(shown);
    else onZoomTo(parsed);
  };
  const disabled = zoom === null;

  return (
    <>
      <button
        type="button"
        className={styles.iconButton}
        disabled={disabled}
        onClick={() => onStep(1)}
        aria-label={t('picker.zoom.in')}
        data-hint={t('picker.zoom.inHint')}
      >
        <InlineIcon icon="search-plus" />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        disabled={disabled}
        onClick={() => onStep(-1)}
        aria-label={t('picker.zoom.out')}
        data-hint={t('picker.zoom.outHint')}
      >
        <InlineIcon icon="search-minus" />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        disabled={disabled}
        onClick={onFit}
        aria-label={t('picker.zoom.fit')}
        data-hint={t('picker.zoom.fitHint')}
      >
        <InlineIcon icon="window-maximize" />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        disabled={disabled}
        onClick={onOriginal}
        aria-label="100%"
        data-hint={t('picker.zoom.originalHint')}
      >
        <InlineIcon icon="search" />
      </button>
      <input
        className={styles.zoomInput}
        aria-label={t('picker.zoom.level')}
        data-hint={t('picker.zoom.levelHint')}
        disabled={disabled}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setDraft(shown);
        }}
      />
    </>
  );
};
