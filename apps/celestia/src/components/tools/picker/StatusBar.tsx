import { FC } from 'react';

import styles from 'modules/PickerStatusBar.module.scss';
import { HoverInfo } from 'src/components/tools/picker/useHoverInfo';
import { rgbToHex } from 'src/utils/color';
import { formatPercent } from 'src/utils/picker/pixels';

const DEFAULT_INFO = 'Use the File menu or drag & drop images to open them for color picking';

/** Message on the left, then the pixel under the pointer and its color and opacity */
export const StatusBar: FC<{ hover: HoverInfo | null; info?: string }> = ({ hover, info = DEFAULT_INFO }) => {
  const color = hover?.color ?? null;
  return (
    <div className={styles.statusBar} role="status">
      <span className={styles.info}>{info}</span>
      <span className={styles.position} title="Image coordinates under the pointer">
        {hover ? `${hover.x},${hover.y}` : ''}
      </span>
      <span className={styles.color} title="Color and opacity of the pixel under the pointer">
        {color && (
          <>
            <span className={styles.swatch} style={{ backgroundColor: rgbToHex(color) }} />
            {rgbToHex(color)} {formatPercent(color.alpha)}%
          </>
        )}
      </span>
    </div>
  );
};
