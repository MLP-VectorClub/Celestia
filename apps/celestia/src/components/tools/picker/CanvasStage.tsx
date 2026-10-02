import { FC, HTMLAttributes, ReactNode, Ref, useEffect, useRef } from 'react';

import styles from 'modules/Picker.module.scss';
import { Size, Viewport } from 'src/utils/picker/viewport';

interface PropTypes extends HTMLAttributes<HTMLDivElement> {
  /** Callback ref, the parent needs to know when the stage exists to measure it */
  containerRef: Ref<HTMLDivElement>;
  image: HTMLImageElement | undefined;
  name: string;
  viewport: Viewport | null;
  viewSize: Size;
  cursor: string | undefined;
  /** Layers drawn over the image, such as the picking areas */
  children?: ReactNode;
}

/** The picking surface: the image drawn at the current zoom and position, filling the whole stage */
export const CanvasStage: FC<PropTypes> = ({ containerRef, image, name, viewport, viewSize, cursor, children, ...rest }) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    el.width = Math.max(1, Math.round(viewSize.width * ratio));
    el.height = Math.max(1, Math.round(viewSize.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, viewSize.width, viewSize.height);
    if (!image || !viewport) return;
    // Magnified pixels stay sharp so single pixels can be told apart, reduced images are smoothed
    ctx.imageSmoothingEnabled = viewport.zoom < 1;
    ctx.drawImage(image, viewport.offsetX, viewport.offsetY, image.naturalWidth * viewport.zoom, image.naturalHeight * viewport.zoom);
  }, [image, viewport, viewSize]);

  return (
    <div ref={containerRef} className={styles.canvasStage} style={{ cursor }} role="img" aria-label={name} {...rest}>
      <canvas ref={canvas} className={styles.stageCanvas} aria-hidden />
      {children}
    </div>
  );
};
