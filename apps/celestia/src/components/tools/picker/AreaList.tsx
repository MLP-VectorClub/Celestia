import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/PickerAreaList.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { AreaListItem } from 'src/components/tools/picker/AreaListItem';
import { PickingArea } from 'src/utils/picker/areas';
import { Pixel } from 'src/utils/picker/pixels';
import { TabState } from 'src/utils/picker/reducer';

interface PropTypes {
  tabs: TabState[];
  activeId: number | null;
  /** Average color of each area by id */
  colors: Map<number, Pixel | null>;
  onActivateTab: (id: number) => void;
  onSelect: (tab: TabState, area: PickingArea, additive: boolean) => void;
  onEdit: (tab: TabState, area: PickingArea) => void;
  /** Select-all and delete work on the active tab */
  onSelectAll: (selected: boolean) => void;
  onDelete: () => void;
}

/** Every open image with its picking areas and the buttons working on the selection */
export const AreaList: FC<PropTypes> = ({ tabs, activeId, colors, onActivateTab, onSelect, onEdit, onSelectAll, onDelete }) => {
  const t = useTranslations();
  const active = tabs.find((tab) => tab.id === activeId);

  return (
    <aside className={styles.list} aria-label={t('picker.list.label')}>
      <span className={styles.title}>{t('picker.list.title')}</span>
      <div className={styles.tabs}>
        {tabs.length === 0 && <p className={styles.empty}>{t('picker.list.noImages')}</p>}
        {tabs.map((tab) => (
          <section key={tab.id} aria-label={tab.name}>
            <button
              type="button"
              className={classNames(styles.tabName, { [styles.activeTab]: tab.id === activeId })}
              onClick={() => onActivateTab(tab.id)}
            >
              {tab.name}
            </button>
            <ul className={styles.areas}>
              {tab.areas.map((area, i) => (
                <AreaListItem
                  key={area.id}
                  index={i + 1}
                  area={area}
                  color={colors.get(area.id) ?? null}
                  selected={tab.selected.includes(area.id)}
                  onSelect={(additive) => onSelect(tab, area, additive)}
                  onEdit={() => onEdit(tab, area)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionButton}
          disabled={!active?.selected.length}
          aria-label={t('picker.list.delete')}
          data-hint={t('picker.list.deleteHint')}
          onClick={onDelete}
        >
          <InlineIcon icon="trash" />
        </button>
        <button
          type="button"
          className={styles.actionButton}
          disabled={!active?.selected.length}
          aria-label={t('picker.list.deselect')}
          data-hint={t('picker.list.deselectHint')}
          onClick={() => onSelectAll(false)}
        >
          <InlineIcon icon="times" />
        </button>
        <button
          type="button"
          className={styles.actionButton}
          disabled={!active?.areas.length}
          aria-label={t('picker.list.selectAll')}
          data-hint={t('picker.list.selectAllHint')}
          onClick={() => onSelectAll(true)}
        >
          <InlineIcon icon="check-circle" />
        </button>
      </div>
    </aside>
  );
};
