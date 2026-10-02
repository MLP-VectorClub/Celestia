import { useTranslations } from 'next-intl';
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
export const MenuBar: FC<PropTypes> = ({ onOpen, onOpenClipboard, onClearSettings, onAbout }) => {
  const t = useTranslations();
  return (
    <nav className={styles.menuBar} aria-label={t('picker.menu.label')}>
      <UncontrolledDropdown>
        <DropdownToggle color="link" className={styles.toggle}>
          {t('picker.menu.file')}
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={onOpen}>
            {t('picker.menu.open')}
            <span className={styles.shortcut}>({mod}O)</span>
          </DropdownItem>
          <DropdownItem onClick={onOpenClipboard}>
            {t('picker.menu.openClipboard')}
            <span className={styles.shortcut}>({mod}Shift+O)</span>
          </DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
      <UncontrolledDropdown>
        <DropdownToggle color="link" className={styles.toggle}>
          {t('picker.menu.tools')}
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={onClearSettings}>{t('picker.menu.clearSettings')}</DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
      <button type="button" className={styles.toggle} onClick={onAbout}>
        {t('picker.menu.about')}
      </button>
    </nav>
  );
};
