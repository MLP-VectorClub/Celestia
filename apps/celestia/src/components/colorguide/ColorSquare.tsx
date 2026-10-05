import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC, KeyboardEvent, MouseEvent, RefObject, useEffect, useRef, useState } from 'react';

import { Color } from '@mlp-vectorclub/api-types';
import styles from 'modules/ColorSquare.module.scss';
import { RgbValuesDialog } from 'src/components/colorguide/RgbValuesDialog';
import { useColorCopySettings } from 'src/hooks/color-copy';
import { copyText } from 'src/utils/clipboard';

interface PropTypes {
  color: Color;
  compact?: boolean;
  innerRef?: RefObject<HTMLSpanElement>;
  /** Names that lead to the color (appearance, color group), shown above its RGB values */
  path?: string[];
}

/**
 * A swatch. Clicking copies its hex code (with the `#` unless the visitor turned that off), Shift+clicking shows its RGB values instead,
 * as on the old site
 */
const ColorSquare: FC<PropTypes> = ({ color, compact = false, innerRef, path = [] }) => {
  const t = useTranslations();
  const { copyHash, rgbOnClick } = useColorCopySettings();
  const [feedback, setFeedback] = useState<'copied' | 'failed' | null>(null);
  const [rgbOpen, setRgbOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const hex = color.hex;
  const act = async (showRgb: boolean) => {
    if (!hex) return;
    if (showRgb) {
      setRgbOpen(true);
      return;
    }
    setFeedback((await copyText(copyHash ? hex : hex.replace('#', ''))) ? 'copied' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback(null), 1200);
  };
  const interactive = hex !== null && hex !== undefined && hex !== '';

  return (
    <>
      <span
        className={classNames(styles.colorSquare, { [styles.compactColorSquare]: compact, [styles.copied]: feedback === 'copied', [styles.failed]: feedback === 'failed' })}
        style={{ backgroundColor: hex ?? undefined }}
        ref={innerRef}
        {...(interactive
          ? {
              role: 'button',
              tabIndex: 0,
              title: compact ? color.label : undefined,
              'aria-label': t('colorGuide.colorCopy.label', { label: color.label, hex }),
              onClick: (e: MouseEvent) => {
                if (e.shiftKey) e.preventDefault();
                void act(e.shiftKey || rgbOnClick);
              },
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void act(e.shiftKey || rgbOnClick);
                }
              },
            }
          : { title: color.label })}
        data-feedback={feedback ? (feedback === 'copied' ? t('common.copied') : t('colorGuide.colorCopy.failed')) : undefined}
      >
        {hex ?? ''}
      </span>
      {rgbOpen && hex && <RgbValuesDialog hex={hex} path={[...path, color.label]} onClose={() => setRgbOpen(false)} />}
    </>
  );
};

export default ColorSquare;
