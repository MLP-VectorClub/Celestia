import { IconProp } from '@fortawesome/fontawesome-svg-core';
import classNames from 'classnames';
import { AnchorHTMLAttributes, ButtonHTMLAttributes, FC } from 'react';

import styles from 'modules/IconButton.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { Tooltipped } from 'src/components/shared/Tooltipped';

type Color = 'link' | 'teal' | 'darkblue' | 'blue' | 'red' | 'orange' | 'green';

interface CommonProps {
  icon: IconProp;
  color: Color;
  /** Shown as a tooltip, and the accessible name since there is no text */
  title: string;
}

/** A square button with just an icon, the way the old site's item and post buttons look */
export const IconButton: FC<CommonProps & ButtonHTMLAttributes<HTMLButtonElement>> = ({ icon, color, title, className, ...rest }) => (
  <Tooltipped title={title}>
    {(ref) => (
      <button ref={ref} type="button" aria-label={title} className={classNames(styles.button, styles[color], className)} {...rest}>
        <InlineIcon icon={icon} />
      </button>
    )}
  </Tooltipped>
);

/** The same look for a link */
export const IconLink: FC<CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>> = ({ icon, color, title, className, ...rest }) => (
  <Tooltipped title={title}>
    {(ref) => (
      <a ref={ref} aria-label={title} className={classNames(styles.button, styles[color], className)} {...rest}>
        <InlineIcon icon={icon} />
      </a>
    )}
  </Tooltipped>
);
