import { FC, useEffect, useRef } from 'react';

import styles from 'modules/Picker.module.scss';
import { AreaShape, PickingArea, areaBounds, roundSlices } from 'src/utils/picker/areas';
import { Pixel, toCssColor } from 'src/utils/picker/pixels';
import { Size, Viewport } from 'src/utils/picker/viewport';

export interface AreaPreview {
  shape: AreaShape;
  /** Image pixel the area would be centered on */
  x: number;
  y: number;
  size: number;
}

interface PropTypes {
  areas: PickingArea[];
  selected: number[];
  color: Pixel;
  viewport: Viewport | null;
  viewSize: Size;
  /** Outline of the area a click would place, shown while the eyedropper is active */
  preview: AreaPreview | null;
}

type Shape = Pick<PickingArea, 'shape' | 'center' | 'size'>;

/** Fills the shape in image coordinates, round areas row by row so the edge follows the pixel grid exactly as it is measured */
function fillShape(ctx: CanvasRenderingContext2D, viewport: Viewport, { shape, center, size }: Shape) {
  const bounds = areaBounds({ center, size });
  const left = viewport.offsetX + bounds.x * viewport.zoom;
  const top = viewport.offsetY + bounds.y * viewport.zoom;
  if (shape === 'square') {
    ctx.fillRect(left, top, size * viewport.zoom, size * viewport.zoom);
    return;
  }
  roundSlices(size).forEach((slice, row) => {
    ctx.fillRect(left + slice.skip * viewport.zoom, top + row * viewport.zoom, slice.length * viewport.zoom, viewport.zoom);
  });
}

function outlineShape(ctx: CanvasRenderingContext2D, viewport: Viewport, { shape, center, size }: Shape) {
  const bounds = areaBounds({ center, size });
  const left = viewport.offsetX + bounds.x * viewport.zoom;
  const top = viewport.offsetY + bounds.y * viewport.zoom;
  const side = size * viewport.zoom;
  ctx.beginPath();
  if (shape === 'square') ctx.rect(left, top, side, side);
  else ctx.ellipse(left + side / 2, top + side / 2, side / 2, side / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** The picking areas of the active tab, drawn over the image, with the selected ones outlined and the outline of the area about to be placed */
export const AreaLayer: FC<PropTypes> = ({ areas, selected, color, viewport, viewSize, preview }) => {
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
    if (!viewport) return;

    ctx.fillStyle = toCssColor(color);
    areas.forEach((area) => fillShape(ctx, viewport, area));

    ctx.lineWidth = 1;
    areas
      .filter((area) => selected.includes(area.id))
      .forEach((area) => {
        ctx.setLineDash([]);
        ctx.strokeStyle = '#000';
        outlineShape(ctx, viewport, area);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#fff';
        outlineShape(ctx, viewport, area);
      });

    if (preview) {
      ctx.setLineDash([]);
      ctx.strokeStyle = '#fff';
      outlineShape(ctx, viewport, { shape: preview.shape, center: { x: preview.x, y: preview.y }, size: preview.size });
    }
  }, [areas, selected, color, viewport, viewSize, preview]);

  return <canvas ref={canvas} className={styles.stageCanvas} aria-hidden />;
};
