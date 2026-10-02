import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/Blending.module.scss';
import { BlendingResult as Result, rgbToHex } from 'src/utils/color';

const Missing: FC<{ what: string }> = ({ what }) => {
  const t = useTranslations();
  return <span className={styles.missing}>{t('tools.blending.missing', { what })}</span>;
};

/** The recovered color as a swatch plus hex, hex with alpha, rgba() and opacity */
export const BlendingResultView: FC<{ result: Result | null }> = ({ result }) => {
  const t = useTranslations();
  if (!result) {
    return (
      <div className={styles.result}>
        <div className={classNames(styles.preview, styles.previewInvalid)} />
        <Missing what={t('tools.blending.hex')} />
        <Missing what={t('tools.blending.hexa')} />
        <Missing what={t('tools.blending.rgba')} />
        <Missing what={t('tools.blending.opacity')} />
      </div>
    );
  }

  const { color, alpha } = result;
  const hex = rgbToHex(color);
  const alphaHex = Math.round(255 * alpha)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
  const rounded = Math.round(alpha * 100) / 100;
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)];

  return (
    <div className={styles.result} aria-live="polite">
      <div className={styles.preview} style={{ backgroundColor: hex }} />
      <span>
        #<code className={styles.red}>{channels[0]}</code>
        <code className={styles.green}>{channels[1]}</code>
        <code className={styles.blue}>{channels[2]}</code>
      </span>
      <span>
        #<code className={styles.red}>{channels[0]}</code>
        <code className={styles.green}>{channels[1]}</code>
        <code className={styles.blue}>{channels[2]}</code>
        <code>{alphaHex}</code>
      </span>
      <span>
        rgba(<code className={styles.red}>{color.red}</code>, <code className={styles.green}>{color.green}</code>,{' '}
        <code className={styles.blue}>{color.blue}</code>, {rounded})
      </span>
      <span>{t('tools.blending.opacityPercent', { percent: Math.round(rounded * 100) })}</span>
    </div>
  );
};
