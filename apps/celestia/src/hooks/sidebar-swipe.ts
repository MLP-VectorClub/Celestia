import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from 'src/store';
import { coreActions } from 'src/store/slices/coreSlice';

/** Below this width the sidebar covers the page (the layout's mobile breakpoint) */
const MOBILE_MAX_WIDTH = 991;

/**
 * Like the old site, swiping left over the page closes an open sidebar on small screens: a horizontal move of a third of the screen (at most 150 px is
 * enough) that stays within 75 px vertically
 */
export function useSidebarSwipe() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.core.sidebarOpen);

  useEffect(() => {
    if (!open) return;
    let start: { x: number; y: number } | null = null;
    const onStart = (e: TouchEvent) => {
      start = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start || window.innerWidth > MOBILE_MAX_WIDTH) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = Math.abs(touch.clientY - start.y);
      start = null;
      if (dx < 0 && -dx >= Math.min(window.innerWidth / 3, 150) && dy <= 75) dispatch(coreActions.toggleSidebar(false));
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [open, dispatch]);
}
