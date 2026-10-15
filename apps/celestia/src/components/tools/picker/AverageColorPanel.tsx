import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';

import styles from 'modules/PickerPanels.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
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
    <div>
      <span className={styles.counters}>{t('picker.average.counters', { areas: areaCount, images: imageCount })}</span>
      {average && (
        <>
          <div className={styles.average}>
            <span
              className={styles.averageColor}
              style={{ backgroundColor: toCssColor(average), color: isLight(average) ? '#000' : '#fff' }}
            >
              {hex}
            </span>
            <button
              type="button"
              className={styles.smallButton}
              aria-label={t('picker.average.copy')}
              onClick={() => void copy()}
              data-hint={t('picker.average.copyHint')}
            >
              <InlineIcon icon="clipboard" />
            </button>
            <button
              type="button"
              className={styles.smallButton}
              aria-label={copyHash ? '#' : t('picker.average.noHash')}
              aria-pressed={copyHash}
              onClick={() => onCopyHashChange(!copyHash)}
              data-hint={t('picker.average.hashHint')}
            >
              <InlineIcon icon="hashtag" />
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
