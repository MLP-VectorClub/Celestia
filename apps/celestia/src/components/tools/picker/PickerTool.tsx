import { FC, useReducer, useState } from 'react';
import { Alert } from 'reactstrap';

import styles from 'modules/Picker.module.scss';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { CanvasStage } from 'src/components/tools/picker/CanvasStage';
import { DropZone } from 'src/components/tools/picker/DropZone';
import { EmptyState } from 'src/components/tools/picker/EmptyState';
import { MenuBar } from 'src/components/tools/picker/MenuBar';
import { StatusBar } from 'src/components/tools/picker/StatusBar';
import { TabBar } from 'src/components/tools/picker/TabBar';
import { Toolbar } from 'src/components/tools/picker/Toolbar';
import { useFileIntake } from 'src/components/tools/picker/useFileIntake';
import { useHoverInfo } from 'src/components/tools/picker/useHoverInfo';
import { useImageStore } from 'src/components/tools/picker/useImageStore';
import { usePickerSettings } from 'src/components/tools/picker/usePickerSettings';
import { usePickerShortcuts } from 'src/components/tools/picker/usePickerShortcuts';
import { usePointerTools } from 'src/components/tools/picker/usePointerTools';
import { useSpaceHeld } from 'src/components/tools/picker/useSpaceHeld';
import { useViewSize } from 'src/components/tools/picker/useViewSize';
import { useViewportActions } from 'src/components/tools/picker/useViewportActions';
import { useWheelNavigation } from 'src/components/tools/picker/useWheelNavigation';
import { TabState, getActiveTab, initialPickerState, pickerReducer } from 'src/utils/picker/reducer';

/** The color picker: menu, tabs for the opened images and the picking surface */
export const PickerTool: FC = () => {
  const { confirm } = useDialog();
  const [state, dispatch] = useReducer(pickerReducer, initialPickerState);
  const store = useImageStore();
  const { settings, reset } = usePickerSettings();
  const intake = useFileIntake({ dispatch, store, pickingSize: settings.pickingAreaSize });
  const active = getActiveTab(state);

  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const viewSize = useViewSize(stage);
  const view = useViewportActions(active, viewSize, dispatch);
  const { hover, update: updateHover } = useHoverInfo(active, store, view.viewport);
  const spaceHeld = useSpaceHeld();
  const pointer = usePointerTools({ tool: state.tool, spaceHeld, onHover: updateHover, zoomStep: view.zoomStep, pan: view.pan });
  useWheelNavigation(stage, view, Boolean(active));
  usePickerShortcuts({
    onOpen: intake.browse,
    onOpenClipboard: () => void intake.pasteFromClipboard(),
    onTool: (tool) => dispatch({ type: 'setTool', tool }),
    onFit: view.fit,
    onOriginal: view.original,
  });

  const closeTab = async (tab: TabState) => {
    const needsConfirm = tab.areas.length > 0;
    if (
      needsConfirm &&
      !(await confirm({
        title: 'Close tab',
        body: `“${tab.name}” has picking areas that will be lost.`,
        confirmLabel: 'Close',
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

  return (
    <DropZone onFiles={(files) => void intake.openFiles(files)}>
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
      />
      <div className={styles.stage}>
        {active ? (
          <CanvasStage
            containerRef={setStage}
            image={store.get(active.hash)}
            name={active.name}
            viewport={view.viewport}
            viewSize={viewSize}
            cursor={pointer.cursor}
            {...pointer.handlers}
          />
        ) : (
          <EmptyState onOpen={intake.browse} busy={intake.busy} />
        )}
      </div>
      <StatusBar hover={hover} />
    </DropZone>
  );
};
