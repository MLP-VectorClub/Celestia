import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC, ReactNode } from 'react';

import styles from 'modules/PickerPanels.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { SizeControls } from 'src/components/tools/picker/SizeControls';
import { ToolButtons } from 'src/components/tools/picker/ToolButtons';
import { ZoomControls } from 'src/components/tools/picker/ZoomControls';
import { ViewportActions } from 'src/components/tools/picker/useViewportActions';
import { Tool } from 'src/utils/picker/reducer';

interface PropTypes extends Pick<ViewportActions, 'fit' | 'original' | 'zoomStep' | 'zoomTo'> {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  zoom: number | null;
  /** Size of newly placed areas on the active image, `null` without an image */
  pickingSize: number | null;
  onPickingSizeChange: (size: number) => void;
  /** Whether the active image has adjusted levels, which highlights the button */
  levelsActive: boolean;
  /** `null` without an image */
  onLevels: (() => void) | null;
  /** The totals and average color of the picking, shown under the size controls */
  statusPanel: ReactNode;
}

/** The panels floating over the picking surface, like the old site's: tools and zoom at the top left, the size of new areas and the picking status at the bottom left */
export const StagePanels: FC<PropTypes> = ({
  tool,
  onToolChange,
  zoom,
  fit,
  original,
  zoomStep,
  zoomTo,
  pickingSize,
  onPickingSizeChange,
  levelsActive,
  onLevels,
  statusPanel,
}) => {
  const t = useTranslations();
  return (
    <>
      <div className={classNames(styles.panel, styles.topLeft)}>
        <div className={styles.section}>
          <span className={styles.label}>{t('picker.panels.picking')}</span>
          <ToolButtons tool={tool} onChange={onToolChange} />
          <button
            type="button"
            className={classNames(styles.iconButton, { [styles.selected]: levelsActive })}
            disabled={onLevels === null}
            aria-label={t('picker.levels.button')}
            aria-pressed={levelsActive}
            data-hint={t('picker.levels.hint')}
            onClick={() => onLevels?.()}
          >
            <InlineIcon icon="sliders-h" />
          </button>
        </div>
        <div className={styles.section} role="group" aria-label={t('picker.zoom.label')}>
          <span className={styles.label}>{t('picker.panels.zooming')}</span>
          <ZoomControls zoom={zoom} onStep={(d) => zoomStep(d)} onFit={fit} onOriginal={original} onZoomTo={(z) => zoomTo(z)} />
        </div>
      </div>
      <div className={classNames(styles.panel, styles.bottomLeft)}>
        <div className={styles.section}>
          <span className={styles.label}>{t('picker.panels.settings')}</span>
          <SizeControls size={pickingSize} onChange={onPickingSizeChange} />
        </div>
        <div className={styles.section}>
          <span className={styles.label}>{t('picker.panels.status')}</span>
          {statusPanel}
        </div>
      </div>
    </>
  );
};
