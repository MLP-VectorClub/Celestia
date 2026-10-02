import { FC, useEffect, useRef } from 'react';

import styles from 'modules/Picker.module.scss';

/** The active image, scaled down to fit. Replaced by the zoomable canvas stage in the next stage */
export const ImagePreview: FC<{ image: HTMLImageElement | undefined; name: string }> = ({ image, name }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !image) return;
    el.width = image.naturalWidth;
    el.height = image.naturalHeight;
    el.getContext('2d')?.drawImage(image, 0, 0);
  }, [image]);

  return <canvas ref={canvas} className={styles.preview} role="img" aria-label={name} />;
};
