import classNames from 'classnames';
import { FC } from 'react';

import styles from 'modules/PickerAreaList.module.scss';
import { AreaListItem } from 'src/components/tools/picker/AreaListItem';
import { AverageColorPanel } from 'src/components/tools/picker/AverageColorPanel';
import { overallAverage } from 'src/utils/picker/area-colors';
import { PickingArea } from 'src/utils/picker/areas';
import { Pixel } from 'src/utils/picker/pixels';
import { TabState } from 'src/utils/picker/reducer';

interface PropTypes {
  tabs: TabState[];
  activeId: number | null;
  /** Average color of each area by id */
  colors: Map<number, Pixel | null>;
  copyHash: boolean;
  onCopyHashChange: (copyHash: boolean) => void;
  onActivateTab: (id: number) => void;
  onSelect: (tab: TabState, area: PickingArea, additive: boolean) => void;
  onEdit: (tab: TabState, area: PickingArea) => void;
  /** Select-all and delete work on the active tab */
  onSelectAll: (selected: boolean) => void;
  onDelete: () => void;
}

/** Every open image with its picking areas, a summary of the picking and the overall average color */
export const AreaList: FC<PropTypes> = ({
  tabs,
  activeId,
  colors,
  copyHash,
  onCopyHashChange,
  onActivateTab,
  onSelect,
  onEdit,
  onSelectAll,
  onDelete,
}) => {
  const active = tabs.find((tab) => tab.id === activeId);
  const withAreas = tabs.filter((tab) => tab.areas.length > 0);
  const areaCount = withAreas.reduce((sum, tab) => sum + tab.areas.length, 0);
  const average = overallAverage(withAreas.flatMap((tab) => tab.areas.map((area) => colors.get(area.id) ?? null)));

  return (
    <aside className={styles.list} aria-label="Picking areas">
      <div className={styles.header}>
        <span className={styles.title}>Picking area list</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.smallButton}
            disabled={!active?.areas.length}
            title="Select all areas of this image (Ctrl+A)"
            onClick={() => onSelectAll(true)}
          >
            Select all
          </button>
          <button
            type="button"
            className={styles.smallButton}
            disabled={!active?.selected.length}
            title="Deselect all areas of this image (Ctrl+Shift+A)"
            onClick={() => onSelectAll(false)}
          >
            Deselect
          </button>
          <button
            type="button"
            className={styles.smallButton}
            disabled={!active?.selected.length}
            title="Delete selected areas (Del)"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
      <div className={styles.tabs}>
        {tabs.length === 0 && <p className={styles.empty}>No images are open.</p>}
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
      <AverageColorPanel
        areaCount={areaCount}
        imageCount={withAreas.length}
        average={average}
        copyHash={copyHash}
        onCopyHashChange={onCopyHashChange}
      />
    </aside>
  );
};
