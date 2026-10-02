import { useCallback, useState } from 'react';

import { ViewportActions } from 'src/components/tools/picker/useViewportActions';
import { ImageStore } from 'src/utils/picker/image-store';
import { Pixel, pixelAtPosition } from 'src/utils/picker/pixels';
import { TabState } from 'src/utils/picker/reducer';
import { pixelAt } from 'src/utils/picker/viewport';

export interface HoverInfo {
  /** Image pixel under the pointer */
  x: number;
  y: number;
  color: Pixel | null;
}

/** Image coordinates and color under the pointer, for the status bar */
export function useHoverInfo(tab: TabState | undefined, store: ImageStore, viewport: ViewportActions['viewport']) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const update = useCallback(
    (point: { x: number; y: number } | null) => {
      const position = tab && viewport && point ? pixelAt(viewport, tab, point) : null;
      if (!tab || !position) {
        setHover(null);
        return;
      }
      const pixels = store.getPixels(tab.hash);
      setHover({ ...position, color: pixels ? pixelAtPosition(pixels.data, pixels.width, pixels.height, position.x, position.y) : null });
    },
    [tab, viewport, store]
  );

  return { hover, update };
}
