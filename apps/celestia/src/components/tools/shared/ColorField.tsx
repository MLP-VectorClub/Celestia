import classNames from 'classnames';
import { ClipboardEvent, FC, MouseEvent } from 'react';

import styles from 'modules/ColorField.module.scss';
import { parseColor, rgbToHex } from 'src/utils/color';

interface PropTypes {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called when the field is Shift+clicked, used to open the RGB entry dialog */
  onRequestRgb?: () => void;
}

/** A color text input with a live swatch. Pasted or left-behind colors are rewritten as `#rrggbb` */
export const ColorField: FC<PropTypes> = ({ id, label, value, onChange, onRequestRgb }) => {
  const color = parseColor(value);
  const normalize = (text: string) => {
    const parsed = parseColor(text);
    if (parsed) onChange(rgbToHex(parsed));
  };

  const handleClick = (e: MouseEvent) => {
    if (e.shiftKey && onRequestRgb) {
      e.preventDefault();
      onRequestRgb();
    }
  };

  return (
    <div className={styles.field} onClick={handleClick}>
      <span
        className={classNames(styles.swatch, { [styles.invalid]: !color })}
        style={color ? { backgroundColor: rgbToHex(color) } : undefined}
        aria-hidden
      />
      <input
        id={id}
        className={styles.input}
        aria-label={label}
        aria-invalid={!color}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => normalize(e.target.value)}
        onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
          const pasted = e.clipboardData.getData('text');
          if (parseColor(pasted)) {
            e.preventDefault();
            normalize(pasted);
          }
        }}
      />
    </div>
  );
};
