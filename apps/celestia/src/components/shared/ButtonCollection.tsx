import classNames from 'classnames';
import { FC, PropsWithChildren } from 'react';
import { ButtonToolbar } from 'reactstrap';

import styles from 'modules/ButtonCollection.module.scss';

interface PropTypes extends PropsWithChildren {
  className?: string;
  leftAlign?: boolean;
}

const ButtonCollection: FC<PropTypes> = ({ children, className, leftAlign = false }) => (
  <ButtonToolbar className={classNames(`justify-content-${leftAlign ? 'left' : 'center'}`, styles.buttonCollection, className)}>
    {children}
  </ButtonToolbar>
);

export default ButtonCollection;
