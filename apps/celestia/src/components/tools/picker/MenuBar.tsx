import { FC } from 'react';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';

import styles from 'modules/PickerMenuBar.module.scss';

interface PropTypes {
  onOpen: () => void;
  onOpenClipboard: () => void;
  onClearSettings: () => void;
  onAbout: () => void;
}

const isMac = typeof navigator !== 'undefined' && /(mac|iphone|ipad)/i.test(navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl+';

/** File and Tools menus of the picker */
export const MenuBar: FC<PropTypes> = ({ onOpen, onOpenClipboard, onClearSettings, onAbout }) => (
  <nav className={styles.menuBar} aria-label="Color picker menu">
    <UncontrolledDropdown>
      <DropdownToggle color="link" className={styles.toggle}>
        File
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem onClick={onOpen}>
          Open… <span className={styles.shortcut}>({mod}O)</span>
        </DropdownItem>
        <DropdownItem onClick={onOpenClipboard}>
          Open from clipboard… <span className={styles.shortcut}>({mod}Shift+O)</span>
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
    <UncontrolledDropdown>
      <DropdownToggle color="link" className={styles.toggle}>
        Tools
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem onClick={onClearSettings}>Clear settings</DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
    <button type="button" className={styles.toggle} onClick={onAbout}>
      About
    </button>
  </nav>
);
