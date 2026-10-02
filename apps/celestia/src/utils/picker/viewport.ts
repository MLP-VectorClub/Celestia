export interface Viewport {
  /** Screen pixels per image pixel */
  zoom: number;
  /** Screen position of the image's top left corner, relative to the view */
  offsetX: number;
  offsetY: number;
}

export interface Size {
  width: number;
  height: number;
}

export const ZOOM = { min: 0.004, max: 32, step: 1.1 } as const;

export const clampZoom = (zoom: number): number => Math.min(ZOOM.max, Math.max(ZOOM.min, zoom));

/** Zoom at which the whole image is visible inside the view */
export const fitZoom = (image: Size, view: Size): number => clampZoom(Math.min(view.width / image.width, view.height / image.height));

/** Viewport showing the image at `zoom`, centered in the view */
export const centeredViewport = (image: Size, view: Size, zoom: number): Viewport => ({
  zoom,
  offsetX: (view.width - image.width * zoom) / 2,
  offsetY: (view.height - image.height * zoom) / 2,
});

/** Next zoom after one wheel/button step in or out */
export const stepZoom = (zoom: number, direction: 1 | -1): number => clampZoom(zoom * ZOOM.step ** direction);

/** Changes the zoom so the image point under `anchor` (view coordinates) stays where it is */
export function zoomAround(viewport: Viewport, newZoom: number, anchor: { x: number; y: number }): Viewport {
  const zoom = clampZoom(newZoom);
  const ratio = zoom / viewport.zoom;
  return {
    zoom,
    offsetX: anchor.x - (anchor.x - viewport.offsetX) * ratio,
    offsetY: anchor.y - (anchor.y - viewport.offsetY) * ratio,
  };
}

export const panViewport = (viewport: Viewport, dx: number, dy: number): Viewport => ({
  ...viewport,
  offsetX: viewport.offsetX + dx,
  offsetY: viewport.offsetY + dy,
});

/** View coordinates to (fractional) image coordinates */
export const viewToImage = (viewport: Viewport, point: { x: number; y: number }) => ({
  x: (point.x - viewport.offsetX) / viewport.zoom,
  y: (point.y - viewport.offsetY) / viewport.zoom,
});

/** Image coordinates to view coordinates */
export const imageToView = (viewport: Viewport, point: { x: number; y: number }) => ({
  x: viewport.offsetX + point.x * viewport.zoom,
  y: viewport.offsetY + point.y * viewport.zoom,
});

/** The whole pixel under a view point, or `null` when it is outside the image */
export function pixelAt(viewport: Viewport, image: Size, point: { x: number; y: number }): { x: number; y: number } | null {
  const { x, y } = viewToImage(viewport, point);
  const px = Math.floor(x);
  const py = Math.floor(y);
  return px < 0 || py < 0 || px >= image.width || py >= image.height ? null : { x: px, y: py };
}
