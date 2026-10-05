import classNames from 'classnames';
import { FC, useMemo } from 'react';

import { Color } from '@mlp-vectorclub/api-types';
import styles from 'modules/ColorListItem.module.scss';
import ColorSquare from 'src/components/colorguide/ColorSquare';
import { hexToRgb } from 'src/utils';

interface PropTypes {
  color: Color;
  hideColorInfo?: boolean;
  /** Names that lead to the color, for the RGB values dialog */
  path?: string[];
}

export const ColorListItem: FC<PropTypes> = ({ color, hideColorInfo, path }) => {
  const rgb = useMemo(() => {
    if (!hideColorInfo && color.hex) return hexToRgb(color.hex);
  }, [color.hex, hideColorInfo]);
  return (
    <li key={color.id} className={styles.colorListItem}>
      <ColorSquare color={color} path={path} />
      <span className={classNames(styles.colorInfo, rgb && styles.detailed)}>
        <span className={styles.colorLabel}>{color.label}</span>
        {rgb && (
          <span className={styles.colorDetails}>
            {color.hex} • rgb({rgb.red}, {rgb.green}, {rgb.blue})
          </span>
        )}
      </span>
    </li>
  );
};
