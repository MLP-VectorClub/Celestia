import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/PickerStatusBar.module.scss';
import { HoverInfo } from 'src/components/tools/picker/useHoverInfo';
import { rgbToHex } from 'src/utils/color';
import { formatPercent } from 'src/utils/picker/pixels';

/** Message on the left, then the pixel under the pointer and its color and opacity */
export const StatusBar: FC<{ hover: HoverInfo | null; info?: string }> = ({ hover, info }) => {
  const t = useTranslations();
  const color = hover?.color ?? null;
  return (
    <div className={styles.statusBar} role="status">
      <span className={styles.info}>{info ?? t('picker.status.default')}</span>
      <span className={styles.position} data-hint={t('picker.status.position')}>
        {hover ? `${hover.x},${hover.y}` : ''}
      </span>
      <span className={styles.color} data-hint={t('picker.status.color')}>
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
