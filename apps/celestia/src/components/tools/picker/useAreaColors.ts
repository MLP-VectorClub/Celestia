import { areaAverageColor } from 'src/utils/picker/area-colors';
import { ImageStore } from 'src/utils/picker/image-store';
import { Pixel } from 'src/utils/picker/pixels';
import { TabState } from 'src/utils/picker/reducer';

/** Average color of every picking area of every tab by area id (`null` for areas without a reading). Cheap to call each render, results are remembered per area */
export function useAreaColors(tabs: TabState[], store: ImageStore): Map<number, Pixel | null> {
  const colors = new Map<number, Pixel | null>();
  tabs.forEach((tab) => {
    if (tab.areas.length === 0) return;
    const pixels = store.getPixels(tab.hash);
    tab.areas.forEach((area) => colors.set(area.id, pixels ? areaAverageColor(area, pixels) : null));
  });
  return colors;
}
