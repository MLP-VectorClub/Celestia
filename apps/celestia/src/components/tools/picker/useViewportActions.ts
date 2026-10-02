import { Dispatch, useCallback, useEffect } from 'react';

import { PickerAction, TabState } from 'src/utils/picker/reducer';
import { Size, Viewport, centeredViewport, fitZoom, panViewport, stepZoom, zoomAround } from 'src/utils/picker/viewport';

interface Point {
  x: number;
  y: number;
}

/** Zooming and panning of the active tab. A tab that has no viewport yet is fitted as soon as the view has a size */
export function useViewportActions(tab: TabState | undefined, viewSize: Size, dispatch: Dispatch<PickerAction>) {
  const viewport = tab?.viewport ?? null;
  const hasSize = viewSize.width > 0 && viewSize.height > 0;
  const center = useCallback((): Point => ({ x: viewSize.width / 2, y: viewSize.height / 2 }), [viewSize]);

  const set = useCallback((next: Viewport) => dispatch({ type: 'setViewport', viewport: next }), [dispatch]);

  const fit = useCallback(() => {
    if (tab && hasSize) set(centeredViewport(tab, viewSize, fitZoom(tab, viewSize)));
  }, [tab, hasSize, viewSize, set]);

  const original = useCallback(() => {
    if (tab && hasSize) set(centeredViewport(tab, viewSize, 1));
  }, [tab, hasSize, viewSize, set]);

  const zoomTo = useCallback(
    (zoom: number, anchor: Point = center()) => {
      if (viewport) set(zoomAround(viewport, zoom, anchor));
    },
    [viewport, center, set]
  );

  const zoomStep = useCallback(
    (direction: 1 | -1, anchor: Point = center()) => {
      if (viewport) set(zoomAround(viewport, stepZoom(viewport.zoom, direction), anchor));
    },
    [viewport, center, set]
  );

  const pan = useCallback(
    (dx: number, dy: number) => {
      if (viewport) set(panViewport(viewport, dx, dy));
    },
    [viewport, set]
  );

  const needsFit = Boolean(tab) && viewport === null && hasSize;
  useEffect(() => {
    if (needsFit) fit();
  }, [needsFit, fit]);

  return { viewport, fit, original, zoomTo, zoomStep, pan };
}

export type ViewportActions = ReturnType<typeof useViewportActions>;
