import { Color } from '@went.tf/mlp-vectorclub-api-types';
import classNames from 'classnames';
import { FC, useMemo } from 'react';

import styles from 'modules/ColorListItem.module.scss';
import ColorSquare from 'src/components/colorguide/ColorSquare';
import { ColorBlending } from 'src/types/sprite-colors';
import { hexToRgb } from 'src/utils';
import { formatRgb } from 'src/utils/color-guide';

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
        <span className={styles.colorLabel}>
          {color.label}
          {(color as ColorBlending).opacity ? <small className="text-muted ms-1">{(color as ColorBlending).opacity}%</small> : null}
        </span>
        {rgb && (
          <span className={styles.colorDetails}>
            {color.hex} • {formatRgb(rgb, (color as ColorBlending).opacity)}
          </span>
        )}
      </span>
    </li>
  );
};
