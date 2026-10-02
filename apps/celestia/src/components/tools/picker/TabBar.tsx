import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/PickerTabBar.module.scss';
import { TabState } from 'src/utils/picker/reducer';

interface PropTypes {
  tabs: TabState[];
  activeId: number | null;
  onActivate: (id: number) => void;
  onClose: (tab: TabState) => void;
}

const splitName = (name: string): [string, string] => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
};

/** One tab per opened image, scrolls sideways when there are many */
export const TabBar: FC<PropTypes> = ({ tabs, activeId, onActivate, onClose }) => {
  const t = useTranslations();
  return (
    <div className={styles.tabBar} role="tablist" aria-label={t('picker.tabs.label')}>
      {tabs.map((tab) => {
        const [base, extension] = splitName(tab.name);
        return (
          <div key={tab.id} className={classNames(styles.tab, { [styles.active]: tab.id === activeId })}>
            <button
              type="button"
              role="tab"
              aria-selected={tab.id === activeId}
              className={styles.select}
              title={tab.name}
              onClick={() => onActivate(tab.id)}
            >
              <span className={styles.name}>{base}</span>
              <span className={styles.extension}>{extension}</span>
            </button>
            <button
              type="button"
              className={styles.close}
              aria-label={t('picker.tabs.close', { name: tab.name })}
              data-hint={t('picker.tabs.closeHint')}
              onClick={() => onClose(tab)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};
