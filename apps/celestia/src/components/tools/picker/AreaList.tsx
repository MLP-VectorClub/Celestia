import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/PickerAreaList.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { AreaListItem } from 'src/components/tools/picker/AreaListItem';
import { PickingArea } from 'src/utils/picker/areas';
import { Pixel } from 'src/utils/picker/pixels';
import { TabState } from 'src/utils/picker/reducer';
import { ColorFormat } from 'src/utils/picker/settings';

interface PropTypes {
  tabs: TabState[];
  activeId: number | null;
  /** Average color of each area by id */
  colors: Map<number, Pixel | null>;
  colorFormat: ColorFormat;
  onColorFormatChange: (format: ColorFormat) => void;
  onActivateTab: (id: number) => void;
  /** Selects every area of the image, or none when they are all selected already */
  onSelectTab: (tab: TabState) => void;
  onSelect: (tab: TabState, area: PickingArea, additive: boolean) => void;
  onEdit: (tab: TabState, area: PickingArea) => void;
  /** Select-all and delete work on the active tab */
  onSelectAll: (selected: boolean) => void;
  onDelete: () => void;
}

/** Every open image with its picking areas and the buttons working on the selection */
export const AreaList: FC<PropTypes> = ({
  tabs,
  activeId,
  colors,
  colorFormat,
  onColorFormatChange,
  onActivateTab,
  onSelectTab,
  onSelect,
  onEdit,
  onSelectAll,
  onDelete,
}) => {
  const t = useTranslations();
  const active = tabs.find((tab) => tab.id === activeId);

  return (
    <aside className={styles.list} aria-label={t('picker.list.label')}>
      <span className={styles.title}>{t('picker.list.title')}</span>
      <div className={styles.tabs}>
        {tabs.length === 0 && <p className={styles.empty}>{t('picker.list.noImages')}</p>}
        {tabs.map((tab) => (
          <section key={tab.id} aria-label={tab.name}>
            <div className={classNames(styles.tabRow, { [styles.activeTab]: tab.id === activeId })}>
              <button type="button" className={styles.tabName} onClick={() => onActivateTab(tab.id)}>
                {tab.name}
              </button>
              <button
                type="button"
                className={classNames(styles.selectHandle, styles.tabHandle, {
                  [styles.handleSelected]: tab.areas.length > 0 && tab.selected.length === tab.areas.length,
                })}
                disabled={tab.areas.length === 0}
                aria-label={t('picker.list.selectImage', { name: tab.name })}
                data-hint={t('picker.list.selectImageHint')}
                onClick={() => onSelectTab(tab)}
              />
            </div>
            <ul className={styles.areas}>
              {tab.areas.map((area, i) => (
                <AreaListItem
                  key={area.id}
                  index={i + 1}
                  area={area}
                  color={colors.get(area.id) ?? null}
                  selected={tab.selected.includes(area.id)}
                  format={colorFormat}
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
          aria-label={colorFormat === 'hex' ? t('picker.list.showRgb') : t('picker.list.showHex')}
          data-hint={colorFormat === 'hex' ? t('picker.list.showRgbHint') : t('picker.list.showHexHint')}
          onClick={() => onColorFormatChange(colorFormat === 'hex' ? 'rgb' : 'hex')}
        >
          <InlineIcon icon={colorFormat === 'hex' ? 'tint' : 'hashtag'} />
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
