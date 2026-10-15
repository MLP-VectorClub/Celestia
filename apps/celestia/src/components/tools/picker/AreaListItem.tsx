import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/PickerAreaList.module.scss';
import { isLight, rgbToHex } from 'src/utils/color';
import { PickingArea } from 'src/utils/picker/areas';
import { Pixel, formatChannels, formatColor, toCssColor } from 'src/utils/picker/pixels';
import { ColorFormat } from 'src/utils/picker/settings';

interface PropTypes {
  index: number;
  area: PickingArea;
  color: Pixel | null;
  selected: boolean;
  format: ColorFormat;
  /** Ctrl, Cmd or Shift while clicking adds to or removes from the selection instead of replacing it */
  onSelect: (additive: boolean) => void;
  onEdit: () => void;
}

/** One picking area: its number, average color and size. Click selects, double click edits */
export const AreaListItem: FC<PropTypes> = ({ index, area, color, selected, format, onSelect, onEdit }) => {
  const t = useTranslations();
  return (
    <li>
      <button
        type="button"
        className={classNames(styles.item, { [styles.selected]: selected })}
        aria-pressed={selected}
        data-hint={t('picker.list.itemHint')}
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
          {color ? (format === 'hex' ? formatColor(color) : formatChannels(color)) : t('picker.list.outside')}
        </span>
        <span className={classNames(styles.size, { [styles.round]: area.shape === 'round' })}>
          <span>
            {/* The shape is drawn by the box's corners, the glyph tells it to screen readers */}
            <span className="visually-hidden">{area.shape === 'round' ? '●' : '■'} </span>
            {area.size}px
          </span>
        </span>
        <span className={classNames(styles.selectHandle, { [styles.handleSelected]: selected })} aria-hidden />
      </button>
    </li>
  );
};
