import { ImagePixels, PickingArea, areaPixels } from 'src/utils/picker/areas';
import { Pixel, averageColor } from 'src/utils/picker/pixels';

/** Areas never change (editing makes a new object) and belong to one image, so an area's average can be remembered for as long as the area exists */
const cache = new WeakMap<PickingArea, Pixel | null>();

/** Average color of the image pixels inside the area, `null` when none of it lies on the image */
export function areaAverageColor(area: PickingArea, image: ImagePixels): Pixel | null {
  if (cache.has(area)) return cache.get(area) ?? null;
  const average = averageColor(areaPixels(area, image));
  cache.set(area, average);
  return average;
}

/** The average of several areas' average colors (areas without a reading are left out), `null` when there are none */
export const overallAverage = (colors: Array<Pixel | null>): Pixel | null =>
  averageColor(colors.filter((color): color is Pixel => color !== null));
