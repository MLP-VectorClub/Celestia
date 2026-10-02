import classNames from 'classnames';
import { FC } from 'react';

import styles from 'modules/PickerToolbar.module.scss';
import { AreaColorControl } from 'src/components/tools/picker/AreaColorControl';
import { SizeControls } from 'src/components/tools/picker/SizeControls';
import { ToolButtons } from 'src/components/tools/picker/ToolButtons';
import { ZoomControls } from 'src/components/tools/picker/ZoomControls';
import { ViewportActions } from 'src/components/tools/picker/useViewportActions';
import { Pixel } from 'src/utils/picker/pixels';
import { Tool } from 'src/utils/picker/reducer';

interface PropTypes extends Pick<ViewportActions, 'fit' | 'original' | 'zoomStep' | 'zoomTo'> {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  zoom: number | null;
  /** Size of newly placed areas on the active image, `null` without an image */
  pickingSize: number | null;
  onPickingSizeChange: (size: number) => void;
  areaColor: Pixel | null;
  onAreaColorChange: (color: Pixel) => void;
  /** Whether the active image has adjusted levels, which highlights the button */
  levelsActive: boolean;
  /** `null` without an image */
  onLevels: (() => void) | null;
}

export const Toolbar: FC<PropTypes> = ({
  tool,
  onToolChange,
  zoom,
  fit,
  original,
  zoomStep,
  zoomTo,
  pickingSize,
  onPickingSizeChange,
  areaColor,
  onAreaColorChange,
  levelsActive,
  onLevels,
}) => (
  <div className={styles.toolbar}>
    <ToolButtons tool={tool} onChange={onToolChange} />
    <SizeControls size={pickingSize} onChange={onPickingSizeChange} />
    <AreaColorControl color={areaColor} onChange={onAreaColorChange} />
    <button
      type="button"
      className={classNames(styles.button, { [styles.active]: levelsActive })}
      disabled={onLevels === null}
      aria-pressed={levelsActive}
      data-hint="Adjust levels: change how the image looks without changing the colors that picking areas report"
      onClick={() => onLevels?.()}
    >
      Levels
    </button>
    <ZoomControls zoom={zoom} onStep={(d) => zoomStep(d)} onFit={fit} onOriginal={original} onZoomTo={(z) => zoomTo(z)} />
  </div>
);
