import { FC, useReducer, useState } from 'react';
import { Alert } from 'reactstrap';

import styles from 'modules/Picker.module.scss';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { AboutDialog } from 'src/components/tools/picker/AboutDialog';
import { AreaEditDialog } from 'src/components/tools/picker/AreaEditDialog';
import { AreaLayer, AreaPreview } from 'src/components/tools/picker/AreaLayer';
import { AreaList } from 'src/components/tools/picker/AreaList';
import { CanvasStage } from 'src/components/tools/picker/CanvasStage';
import { DropZone } from 'src/components/tools/picker/DropZone';
import { EmptyState } from 'src/components/tools/picker/EmptyState';
import { LevelsDialog } from 'src/components/tools/picker/LevelsDialog';
import { MenuBar } from 'src/components/tools/picker/MenuBar';
import { ResizeHandle } from 'src/components/tools/picker/ResizeHandle';
import { StatusBar } from 'src/components/tools/picker/StatusBar';
import { TabBar } from 'src/components/tools/picker/TabBar';
import { Toolbar } from 'src/components/tools/picker/Toolbar';
import { useAreaColors } from 'src/components/tools/picker/useAreaColors';
import { useFileIntake } from 'src/components/tools/picker/useFileIntake';
import { useHints } from 'src/components/tools/picker/useHints';
import { useHoverInfo } from 'src/components/tools/picker/useHoverInfo';
import { useImageStore } from 'src/components/tools/picker/useImageStore';
import { useKeyHeld } from 'src/components/tools/picker/useKeyHeld';
import { usePickerSettings } from 'src/components/tools/picker/usePickerSettings';
import { usePickerShortcuts } from 'src/components/tools/picker/usePickerShortcuts';
import { usePointerTools } from 'src/components/tools/picker/usePointerTools';
import { useViewSize } from 'src/components/tools/picker/useViewSize';
import { useViewportActions } from 'src/components/tools/picker/useViewportActions';
import { useWheelNavigation } from 'src/components/tools/picker/useWheelNavigation';
import { PickingArea, clampAreaSize } from 'src/utils/picker/areas';
import { isFullRange } from 'src/utils/picker/levels';
import { TabState, getActiveTab, initialPickerState, pickerReducer } from 'src/utils/picker/reducer';
import { pixelAt } from 'src/utils/picker/viewport';

/** The color picker: menu, tabs for the opened images, the picking surface and the list of picking areas */
export const PickerTool: FC = () => {
  const { confirm } = useDialog();
  const [state, dispatch] = useReducer(pickerReducer, initialPickerState);
  const store = useImageStore();
  const { settings, update: updateSettings, reset } = usePickerSettings();
  const intake = useFileIntake({ dispatch, store, pickingSize: settings.pickingAreaSize });
  const active = getActiveTab(state);

  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const viewSize = useViewSize(stage);
  const view = useViewportActions(active, viewSize, dispatch);
  const { hover, update: updateHover } = useHoverInfo(active, store, view.viewport);
  const spaceHeld = useKeyHeld(['Space'], { ignoreTyping: true, preventDefault: true });
  const altHeld = useKeyHeld(['AltLeft', 'AltRight']);
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ tab: TabState; area: PickingArea } | null>(null);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { hint, handlers: hintHandlers } = useHints();
  const areaColors = useAreaColors(state.tabs, store);

  const place = (point: { x: number; y: number }, round: boolean) => {
    const position = active && view.viewport ? pixelAt(view.viewport, active, point) : null;
    if (position) dispatch({ type: 'placeArea', shape: round ? 'round' : 'square', ...position });
  };
  const pointer = usePointerTools({
    tool: state.tool,
    spaceHeld,
    onHover: updateHover,
    onPick: place,
    zoomStep: view.zoomStep,
    pan: view.pan,
  });
  useWheelNavigation(stage, view, Boolean(active));

  const setPickingSize = (size: number) => {
    const clamped = clampAreaSize(size);
    dispatch({ type: 'setPickingSize', size: clamped });
    updateSettings({ pickingAreaSize: clamped });
  };
  const deleteSelected = () => {
    if (active?.selected.length) dispatch({ type: 'removeAreas', ids: active.selected });
  };

  usePickerShortcuts({
    onOpen: intake.browse,
    onOpenClipboard: () => void intake.pasteFromClipboard(),
    onTool: (tool) => dispatch({ type: 'setTool', tool }),
    onFit: view.fit,
    onOriginal: view.original,
    onSelectAll: (selected) => dispatch({ type: 'selectAll', selected }),
    onDeleteSelected: deleteSelected,
    onSizeStep: (delta) => active && setPickingSize(active.pickingSize + delta),
  });

  const closeTab = async (tab: TabState) => {
    const needsConfirm = tab.areas.length > 0;
    if (
      needsConfirm &&
      !(await confirm({
        title: 'Close tab',
        body: `“${tab.name}” has picking areas that will be lost.`,
        confirmLabel: 'Close tab',
        color: 'danger',
      }))
    )
      return;
    dispatch({ type: 'closeTab', id: tab.id });
  };

  const clearSettings = async () => {
    if (await confirm({ title: 'Clear settings', body: 'The picker settings will be reset to their defaults.', confirmLabel: 'Clear' }))
      reset();
  };

  // The outline of the area a click would place, only while the eyedropper is the tool in use
  const showPreview = active && hover && pointer.effectiveTool === 'picker';
  const preview: AreaPreview | null = showPreview
    ? { shape: altHeld ? 'round' : 'square', x: hover.x, y: hover.y, size: active.pickingSize }
    : null;
  const pickerWidth = liveWidth ?? settings.pickerWidth;

  return (
    <DropZone onFiles={(files) => void intake.openFiles(files)} {...hintHandlers}>
      <input
        ref={intake.inputRef}
        type="file"
        hidden
        multiple
        aria-label="Open images"
        accept="image/png,image/jpeg,image/bmp,image/gif,image/webp,.png,.jpg,.jpeg,.bmp,.gif,.webp"
        onChange={(e) => {
          void intake.openFiles(Array.from(e.target.files ?? []));
          if (intake.inputRef.current) intake.inputRef.current.value = '';
        }}
      />
      <MenuBar
        onOpen={intake.browse}
        onOpenClipboard={() => void intake.pasteFromClipboard()}
        onClearSettings={() => void clearSettings()}
        onAbout={() => setAboutOpen(true)}
      />
      <TabBar
        tabs={state.tabs}
        activeId={state.activeId}
        onActivate={(id) => dispatch({ type: 'activateTab', id })}
        onClose={(tab) => void closeTab(tab)}
      />
      {intake.errors.length > 0 && (
        <Alert color="danger" toggle={intake.dismissErrors} fade={false} className="m-2">
          {intake.errors.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </Alert>
      )}
      <Toolbar
        tool={state.tool}
        onToolChange={(tool) => dispatch({ type: 'setTool', tool })}
        zoom={view.viewport?.zoom ?? null}
        fit={view.fit}
        original={view.original}
        zoomStep={view.zoomStep}
        zoomTo={view.zoomTo}
        pickingSize={active?.pickingSize ?? null}
        onPickingSizeChange={setPickingSize}
        areaColor={active?.areaColor ?? null}
        onAreaColorChange={(color) => dispatch({ type: 'setAreaColor', color })}
        levelsActive={Boolean(active) && !isFullRange(active!.levels)}
        onLevels={active ? () => setLevelsOpen(true) : null}
      />
      <div className={styles.body}>
        <div className={styles.stage} style={{ flexBasis: `${pickerWidth}%` }}>
          {active ? (
            <CanvasStage
              containerRef={setStage}
              source={isFullRange(active.levels) ? store.get(active.hash) : store.getLevelled(active.hash, active.levels)}
              imageSize={active}
              name={active.name}
              viewport={view.viewport}
              viewSize={viewSize}
              cursor={pointer.cursor}
              {...pointer.handlers}
            >
              <AreaLayer
                areas={active.areas}
                selected={active.selected}
                color={active.areaColor}
                viewport={view.viewport}
                viewSize={viewSize}
                preview={preview}
              />
            </CanvasStage>
          ) : (
            <EmptyState onOpen={intake.browse} busy={intake.busy} />
          )}
        </div>
        <ResizeHandle
          onResize={setLiveWidth}
          onCommit={(percent) => {
            updateSettings({ pickerWidth: percent });
            setLiveWidth(null);
          }}
        />
        <AreaList
          tabs={state.tabs}
          activeId={state.activeId}
          colors={areaColors}
          copyHash={settings.copyHash}
          onCopyHashChange={(copyHash) => updateSettings({ copyHash })}
          onActivateTab={(id) => dispatch({ type: 'activateTab', id })}
          onSelect={(tab, area, additive) => {
            dispatch({ type: 'activateTab', id: tab.id });
            dispatch({ type: 'selectAreas', ids: [area.id], mode: additive ? 'toggle' : 'replace' });
          }}
          onEdit={(tab, area) => {
            dispatch({ type: 'activateTab', id: tab.id });
            setEditing({ tab, area });
          }}
          onSelectAll={(selected) => dispatch({ type: 'selectAll', selected })}
          onDelete={deleteSelected}
        />
      </div>
      <StatusBar hover={hover} info={hint ?? undefined} />
      <LevelsDialog
        levels={levelsOpen ? (active?.levels ?? null) : null}
        onClose={() => setLevelsOpen(false)}
        onSubmit={(levels) => dispatch({ type: 'setLevels', levels })}
      />
      <AboutDialog isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <AreaEditDialog
        area={editing?.area ?? null}
        onClose={() => setEditing(null)}
        onSubmit={(change) => editing && dispatch({ type: 'reshapeAreas', ids: [editing.area.id], ...change })}
      />
    </DropZone>
  );
};
