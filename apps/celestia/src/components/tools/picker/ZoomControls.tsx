import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';

import styles from 'modules/PickerToolbar.module.scss';
import { formatZoom, parseZoomPercent } from 'src/utils/picker/viewport';

interface PropTypes {
  zoom: number | null;
  onStep: (direction: 1 | -1) => void;
  onFit: () => void;
  onOriginal: () => void;
  onZoomTo: (zoom: number) => void;
}

/** Zoom out/in, fit, 100% and a field to type any zoom between 0.4% and 3200% */
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

  return (
    <div className={styles.group} role="group" aria-label={t('picker.zoom.label')}>
      <button
        type="button"
        className={styles.button}
        disabled={zoom === null}
        onClick={() => onStep(-1)}
        aria-label={t('picker.zoom.out')}
        data-hint={t('picker.zoom.outHint')}
      >
        −
      </button>
      <input
        className={styles.zoomInput}
        aria-label={t('picker.zoom.level')}
        data-hint={t('picker.zoom.levelHint')}
        disabled={zoom === null}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setDraft(shown);
        }}
      />
      <button
        type="button"
        className={styles.button}
        disabled={zoom === null}
        onClick={() => onStep(1)}
        aria-label={t('picker.zoom.in')}
        data-hint={t('picker.zoom.inHint')}
      >
        +
      </button>
      <button type="button" className={styles.button} disabled={zoom === null} onClick={onFit} data-hint={t('picker.zoom.fitHint')}>
        {t('picker.zoom.fit')}
      </button>
      <button
        type="button"
        className={styles.button}
        disabled={zoom === null}
        onClick={onOriginal}
        data-hint={t('picker.zoom.originalHint')}
      >
        100%
      </button>
    </div>
  );
};
