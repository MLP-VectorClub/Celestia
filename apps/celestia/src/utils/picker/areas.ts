import { Pixel } from 'src/utils/picker/pixels';

export type AreaShape = 'square' | 'round';

export interface PickingArea {
  id: number;
  shape: AreaShape;
  /** Image coordinates (pixels) of the middle of the area */
  center: { x: number; y: number };
  /** Side length of the square, or diameter of the circle, in pixels */
  size: number;
}

export interface Bounds {
  x: number;
  y: number;
  size: number;
}

export interface Slice {
  /** Pixels at the start of the row that are outside the circle */
  skip: number;
  /** Pixels of the row that are inside the circle */
  length: number;
}

export interface ImagePixels {
  /** RGBA bytes, row by row */
  data: ArrayLike<number>;
  width: number;
  height: number;
}

export const MIN_AREA_SIZE = 1;
export const MAX_AREA_SIZE = 400;

export const clampAreaSize = (size: number): number => Math.min(MAX_AREA_SIZE, Math.max(MIN_AREA_SIZE, Math.round(size) || MIN_AREA_SIZE));

/** The square the area fits in; the area is centered on `center` (for even sizes the extra pixel falls on the bottom/right) */
export function areaBounds({ center, size }: Pick<PickingArea, 'center' | 'size'>): Bounds {
  const half = Math.floor(size / 2);
  return { x: center.x - half, y: center.y - half, size };
}

/** For each row of a circle with this diameter, the run of pixels inside the circle (pixel centers within the radius) */
export function roundSlices(diameter: number): Slice[] {
  const radius = diameter / 2;
  const middle = radius - 0.5;
  const slices: Slice[] = [];
  for (let row = 0; row < diameter; row++) {
    let skip = -1;
    let length = 0;
    for (let col = 0; col < diameter; col++) {
      if (Math.hypot(row - middle, col - middle) <= radius) {
        if (skip === -1) skip = col;
        length++;
      }
    }
    slices.push({ skip: Math.max(skip, 0), length });
  }
  return slices;
}

/** Whether the image pixel at (x, y) belongs to the area */
export function areaContains(area: PickingArea, x: number, y: number): boolean {
  const bounds = areaBounds(area);
  const col = x - bounds.x;
  const row = y - bounds.y;
  if (col < 0 || row < 0 || col >= bounds.size || row >= bounds.size) return false;
  if (area.shape === 'square') return true;
  const slice = roundSlices(area.size)[row];
  return col >= slice.skip && col < slice.skip + slice.length;
}

/** The pixels of the image that lie inside the area; parts of the area outside the image are ignored */
export function areaPixels(area: PickingArea, image: ImagePixels): Pixel[] {
  const bounds = areaBounds(area);
  const slices = area.shape === 'round' ? roundSlices(area.size) : null;
  const pixels: Pixel[] = [];

  for (let row = 0; row < bounds.size; row++) {
    const y = bounds.y + row;
    if (y < 0 || y >= image.height) continue;
    const start = slices ? slices[row].skip : 0;
    const end = slices ? slices[row].skip + slices[row].length : bounds.size;
    for (let col = start; col < end; col++) {
      const x = bounds.x + col;
      if (x < 0 || x >= image.width) continue;
      const i = (y * image.width + x) * 4;
      pixels.push({ red: image.data[i], green: image.data[i + 1], blue: image.data[i + 2], alpha: image.data[i + 3] / 255 });
    }
  }
  return pixels;
}

/** The topmost (last placed) area containing the point, if any */
export function findAreaAt(areas: PickingArea[], x: number, y: number): PickingArea | undefined {
  for (let i = areas.length - 1; i >= 0; i--) {
    if (areaContains(areas[i], x, y)) return areas[i];
  }
  return undefined;
}

/** The area with a new size or shape, keeping its center */
export const reshapeArea = (area: PickingArea, change: Partial<Pick<PickingArea, 'size' | 'shape'>>): PickingArea => ({
  ...area,
  ...change,
  size: clampAreaSize(change.size ?? area.size),
});
