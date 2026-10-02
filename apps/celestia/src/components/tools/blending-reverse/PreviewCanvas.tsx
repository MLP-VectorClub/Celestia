import { FC, RefObject } from 'react';

import styles from 'modules/BlendingReverse.module.scss';

interface PropTypes {
  imageRef: RefObject<HTMLCanvasElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  showOverlay: boolean;
  empty: boolean;
}

/** The image canvas with the highlight overlay stacked on top */
export const PreviewCanvas: FC<PropTypes> = ({ imageRef, overlayRef, showOverlay, empty }) => (
  <div className={styles.previewWrap}>
    {empty && <p className="text-muted fst-italic text-center m-3">Choose an image or a color to see the preview.</p>}
    <div className={styles.preview} hidden={empty}>
      <canvas ref={imageRef} className={styles.canvas} aria-label="Image with the filter removed" />
      <canvas ref={overlayRef} className={styles.canvas} hidden={!showOverlay} aria-hidden />
    </div>
  </div>
);
