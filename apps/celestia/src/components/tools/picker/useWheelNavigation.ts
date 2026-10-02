import { useEffect } from 'react';

import { ViewportActions } from 'src/components/tools/picker/useViewportActions';

/** Alt/Ctrl/Cmd + wheel (and a trackpad pinch) zooms around the pointer, the plain wheel pans */
export function useWheelNavigation(el: HTMLElement | null, { zoomStep, pan }: Pick<ViewportActions, 'zoomStep' | 'pan'>, enabled: boolean) {
  useEffect(() => {
    if (!el || !enabled) return undefined;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.altKey || e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        zoomStep(e.deltaY < 0 ? 1 : -1, { x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else pan(-e.deltaX, -e.deltaY);
    };
    // Not passive, scrolling the page behind the picker has to be prevented
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [el, enabled, zoomStep, pan]);
}
