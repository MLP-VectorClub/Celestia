import classNames from 'classnames';
import { FC } from 'react';

import styles from 'modules/PickerAreaList.module.scss';
import { isLight, rgbToHex } from 'src/utils/color';
import { PickingArea } from 'src/utils/picker/areas';
import { Pixel, formatColor, toCssColor } from 'src/utils/picker/pixels';

interface PropTypes {
  index: number;
  area: PickingArea;
  color: Pixel | null;
  selected: boolean;
  /** Ctrl, Cmd or Shift while clicking adds to or removes from the selection instead of replacing it */
  onSelect: (additive: boolean) => void;
  onEdit: () => void;
}

/** One picking area: its number, average color and size. Click selects, double click edits */
export const AreaListItem: FC<PropTypes> = ({ index, area, color, selected, onSelect, onEdit }) => (
  <li>
    <button
      type="button"
      className={classNames(styles.item, { [styles.selected]: selected })}
      aria-pressed={selected}
      data-hint="Picking area (click to select, Ctrl/Shift+click to select several, double click to change shape and size)"
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey || e.shiftKey)}
      onDoubleClick={onEdit}
    >
      <span className={styles.index}>{index}</span>
      <span
        className={styles.color}
        style={
          color ? { backgroundColor: toCssColor(color), color: isLight({ ...color }) || color.alpha < 0.5 ? '#000' : '#fff' } : undefined
        }
        data-hex={color ? rgbToHex(color) : undefined}
      >
        {color ? formatColor(color) : 'Outside the image'}
      </span>
      <span className={styles.size}>
        {area.shape === 'round' ? '●' : '■'} {area.size}px
      </span>
    </button>
  </li>
);
