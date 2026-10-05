import classNames from 'classnames';
import { FC, PropsWithChildren } from 'react';

import styles from 'modules/RibbonHeading.module.scss';

interface PropTypes extends PropsWithChildren {
  color?: 'plain' | 'blue' | 'orange' | 'darkblue' | 'green' | 'ui';
  id?: string;
}

/** A section heading in the old site's colored ribbon style, children after the title (usually buttons) sit inside the ribbon */
export const RibbonHeading: FC<PropTypes> = ({ color = 'plain', id, children }) => (
  <h2 id={id} className={classNames(styles.ribbon, styles[color])}>
    {children}
  </h2>
);
