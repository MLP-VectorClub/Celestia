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
  const shown = zoom === null ? '' : formatZoom(zoom);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);

  const commit = () => {
    const parsed = parseZoomPercent(draft);
    if (parsed === null) setDraft(shown);
    else onZoomTo(parsed);
  };

  return (
    <div className={styles.group} role="group" aria-label="Zoom">
      <button
        type="button"
        className={styles.button}
        disabled={zoom === null}
        onClick={() => onStep(-1)}
        aria-label="Zoom out"
        title="Zoom out (Alt+scroll down)"
      >
        −
      </button>
      <input
        className={styles.zoomInput}
        aria-label="Zoom level"
        title="Current zoom level, type a value between 0.4% and 3200%"
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
        aria-label="Zoom in"
        title="Zoom in (Alt+scroll up)"
      >
        +
      </button>
      <button type="button" className={styles.button} disabled={zoom === null} onClick={onFit} title="Fit in view (Ctrl+0)">
        Fit
      </button>
      <button type="button" className={styles.button} disabled={zoom === null} onClick={onOriginal} title="Original size (Ctrl+1)">
        100%
      </button>
    </div>
  );
};
