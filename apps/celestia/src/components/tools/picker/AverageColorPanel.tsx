import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';

import styles from 'modules/PickerAreaList.module.scss';
import { isLight, rgbToHex } from 'src/utils/color';
import { Pixel, formatRgb, toCssColor } from 'src/utils/picker/pixels';

interface PropTypes {
  areaCount: number;
  imageCount: number;
  /** Average of all areas' average colors, `null` without areas */
  average: Pixel | null;
  copyHash: boolean;
  onCopyHashChange: (copyHash: boolean) => void;
}

/** Totals of the picking, the overall average color and a button to copy it (with or without the `#`) */
export const AverageColorPanel: FC<PropTypes> = ({ areaCount, imageCount, average, copyHash, onCopyHashChange }) => {
  const t = useTranslations();
  const [status, setStatus] = useState<'copied' | 'failed' | null>(null);
  useEffect(() => {
    if (!status) return undefined;
    const timer = setTimeout(() => setStatus(null), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const hex = average ? rgbToHex(average) : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyHash ? hex : hex.slice(1));
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <div className={styles.status}>
      <div className={styles.counters}>{t('picker.average.counters', { areas: areaCount, images: imageCount })}</div>
      {average && (
        <>
          <div className={styles.average}>
            <span
              className={styles.averageColor}
              style={{ backgroundColor: toCssColor(average), color: isLight(average) ? '#000' : '#fff' }}
            >
              {hex}
            </span>
            <button type="button" className={styles.smallButton} onClick={() => void copy()} data-hint={t('picker.average.copyHint')}>
              {t('picker.average.copy')}
            </button>
            <button
              type="button"
              className={styles.smallButton}
              aria-pressed={copyHash}
              onClick={() => onCopyHashChange(!copyHash)}
              data-hint={t('picker.average.hashHint')}
            >
              {copyHash ? '#' : t('picker.average.noHash')}
            </button>
          </div>
          <div className={styles.rgb}>{formatRgb(average)}</div>
        </>
      )}
      {status && (
        <div role="status" className={styles.copyStatus}>
          {status === 'copied' ? t('picker.average.copied') : t('picker.average.copyFailed')}
        </div>
      )}
    </div>
  );
};
