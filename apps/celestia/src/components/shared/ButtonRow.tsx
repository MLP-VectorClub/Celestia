import classNames from 'classnames';
import { ComponentPropsWithoutRef, ElementType, FC } from 'react';

type PropTypes = ComponentPropsWithoutRef<'div'> & {
  /** Bootstrap gap step (`gap-N`); icon-only buttons use 1, everything else the login dialog's 2 */
  gap?: 1 | 2 | 3;
  justify?: 'start' | 'center' | 'end';
  /** Lay the row out inline (next to text) instead of as a block */
  inline?: boolean;
  as?: ElementType;
};

/** A wrapping row of buttons spaced with `gap` (like the login dialog's alternative sign-ins) instead of per-button margins */
const ButtonRow: FC<PropTypes> = ({ gap = 2, justify, inline = false, as: Tag = 'div', className, ...rest }) => (
  <Tag
    className={classNames(inline ? 'd-inline-flex' : 'd-flex', 'flex-wrap', `gap-${gap}`, justify && `justify-content-${justify}`, className)}
    {...rest}
  />
);

export default ButtonRow;
