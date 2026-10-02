import { FC } from 'react';

import styles from 'modules/PickerToolbar.module.scss';
import { ToolButtons } from 'src/components/tools/picker/ToolButtons';
import { ZoomControls } from 'src/components/tools/picker/ZoomControls';
import { ViewportActions } from 'src/components/tools/picker/useViewportActions';
import { Tool } from 'src/utils/picker/reducer';

interface PropTypes extends Pick<ViewportActions, 'fit' | 'original' | 'zoomStep' | 'zoomTo'> {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  zoom: number | null;
}

export const Toolbar: FC<PropTypes> = ({ tool, onToolChange, zoom, fit, original, zoomStep, zoomTo }) => (
  <div className={styles.toolbar}>
    <ToolButtons tool={tool} onChange={onToolChange} />
    <ZoomControls zoom={zoom} onStep={(d) => zoomStep(d)} onFit={fit} onOriginal={original} onZoomTo={(z) => zoomTo(z)} />
  </div>
);
