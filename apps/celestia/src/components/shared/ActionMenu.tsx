import { IconProp } from '@fortawesome/fontawesome-svg-core';
import classNames from 'classnames';
import { FC } from 'react';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';

import styles from 'modules/ActionMenu.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { Tooltipped } from 'src/components/shared/Tooltipped';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: IconProp;
  onClick?: () => void;
  /** Makes the item a link */
  href?: string;
  /** Opens a link in a new tab */
  external?: boolean;
  disabled?: boolean;
  danger?: boolean;
  /** Draws a divider above the item */
  separated?: boolean;
}

interface PropTypes {
  /** Name of the menu, for screen readers and as the tooltip of the button */
  title: string;
  items: ActionMenuItem[];
  className?: string;
  /** Opens to the left of the button instead of the right */
  alignEnd?: boolean;
}

/**
 * A "⋯" button that opens a menu of actions. Everything the old site only offered on a right click goes here (or is a button of its own),
 * so no function hides behind a context menu
 */
export const ActionMenu: FC<PropTypes> = ({ title, items, className, alignEnd = false }) => {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <UncontrolledDropdown className={classNames(styles.actionMenu, className)}>
      <Tooltipped title={title}>
        {(ref) => (
          <DropdownToggle tag="button" type="button" className={styles.toggle} innerRef={ref} aria-label={title}>
            <InlineIcon icon="ellipsis-h" />
          </DropdownToggle>
        )}
      </Tooltipped>
      <DropdownMenu end={alignEnd} container="body">
        {visible.map((item) => (
          <div key={item.key}>
            {item.separated && <DropdownItem divider />}
            <DropdownItem
              tag={item.href ? 'a' : 'button'}
              href={item.href}
              {...(item.href && item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              disabled={item.disabled}
              className={classNames({ 'text-danger': item.danger })}
              onClick={item.onClick}
            >
              {item.icon && <InlineIcon icon={item.icon} first fixedWidth />}
              {item.label}
            </DropdownItem>
          </div>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};
