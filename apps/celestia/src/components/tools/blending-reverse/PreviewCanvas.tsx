import { useTranslations } from 'next-intl';
import { FC, RefObject } from 'react';

import styles from 'modules/BlendingReverse.module.scss';

interface PropTypes {
  imageRef: RefObject<HTMLCanvasElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  showOverlay: boolean;
  empty: boolean;
}

/** The image canvas with the highlight overlay stacked on top */
export const PreviewCanvas: FC<PropTypes> = ({ imageRef, overlayRef, showOverlay, empty }) => {
  const t = useTranslations();
  return (
    <div className={styles.previewWrap}>
      {empty && <p className="text-muted fst-italic text-center m-3">{t('tools.reverse.previewEmpty')}</p>}
      <div className={styles.preview} hidden={empty}>
        <canvas ref={imageRef} className={styles.canvas} aria-label={t('tools.reverse.previewImage')} />
        <canvas ref={overlayRef} className={styles.canvas} hidden={!showOverlay} aria-hidden />
      </div>
    </div>
  );
};
