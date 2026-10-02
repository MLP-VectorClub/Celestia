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

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** Totals of the picking, the overall average color and a button to copy it (with or without the `#`) */
export const AverageColorPanel: FC<PropTypes> = ({ areaCount, imageCount, average, copyHash, onCopyHashChange }) => {
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
      <div className={styles.counters}>
        {plural(areaCount, 'area')} &amp; {plural(imageCount, 'image')}
      </div>
      {average && (
        <>
          <div className={styles.average}>
            <span
              className={styles.averageColor}
              style={{ backgroundColor: toCssColor(average), color: isLight(average) ? '#000' : '#fff' }}
            >
              {hex}
            </span>
            <button type="button" className={styles.smallButton} onClick={() => void copy()} title="Copy average color to clipboard">
              Copy
            </button>
            <button
              type="button"
              className={styles.smallButton}
              aria-pressed={copyHash}
              onClick={() => onCopyHashChange(!copyHash)}
              title="Toggle whether the hash symbol is copied with the color code"
            >
              {copyHash ? '#' : 'no #'}
            </button>
          </div>
          <div className={styles.rgb}>{formatRgb(average)}</div>
        </>
      )}
      {status && (
        <div role="status" className={styles.copyStatus}>
          {status === 'copied' ? 'Copied to the clipboard.' : 'Could not copy, the browser blocked clipboard access.'}
        </div>
      )}
    </div>
  );
};
