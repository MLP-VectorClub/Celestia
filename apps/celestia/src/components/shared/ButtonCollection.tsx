import classNames from 'classnames';
import { FC, PropsWithChildren } from 'react';
import { ButtonToolbar } from 'reactstrap';

import styles from 'modules/ButtonCollection.module.scss';

interface PropTypes extends PropsWithChildren {
  className?: string;
  leftAlign?: boolean;
  /** Keeps the size each button asks for (small ones in a card), instead of giving the row's buttons one size */
  compact?: boolean;
}

const ButtonCollection: FC<PropTypes> = ({ children, className, leftAlign = false, compact = false }) => (
  <ButtonToolbar
    className={classNames(
      `justify-content-${leftAlign ? 'left' : 'center'}`,
      styles.buttonCollection,
      { [styles.compact]: compact },
      className
    )}
  >
    {children}
  </ButtonToolbar>
);

export default ButtonCollection;
