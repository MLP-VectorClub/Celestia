import { MouseEvent, PointerEvent, useRef, useState } from 'react';

import { ViewportActions } from 'src/components/tools/picker/useViewportActions';
import { Tool } from 'src/utils/picker/reducer';

interface Options extends Pick<ViewportActions, 'zoomStep' | 'pan'> {
  tool: Tool;
  /** Space is held, which acts as the hand tool */
  spaceHeld: boolean;
  /** Pointer position in view coordinates, `null` when it left the view */
  onHover: (point: { x: number; y: number } | null) => void;
  /** The eyedropper was clicked at this view position; `round` when Alt was held */
  onPick: (point: { x: number; y: number }, round: boolean) => void;
}

/** Pointer handling of the stage: hand drags the image, zoom clicks zoom in (Alt or right click: out), the eyedropper places an area (Alt: round) */
export function usePointerTools({ tool, spaceHeld, onHover, onPick, zoomStep, pan }: Options) {
  const effective: Tool = spaceHeld ? 'hand' : tool;
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  const point = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlers = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, moved: false };
      if (effective === 'hand') setDragging(true);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      onHover(point(e));
      const current = drag.current;
      if (!current) return;
      const dx = e.clientX - current.x;
      const dy = e.clientY - current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) current.moved = true;
      if (effective === 'hand') {
        pan(dx, dy);
        current.x = e.clientX;
        current.y = e.clientY;
      }
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const current = drag.current;
      drag.current = null;
      setDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      if (!current || current.moved) return;
      if (effective === 'zoom') zoomStep(e.altKey ? -1 : 1, point(e));
      else if (effective === 'picker') onPick(point(e), e.altKey);
    },
    onPointerCancel: () => {
      drag.current = null;
      setDragging(false);
    },
    onPointerLeave: () => onHover(null),
    onContextMenu: (e: MouseEvent<HTMLElement>) => {
      if (effective !== 'zoom') return;
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      zoomStep(-1, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
  };

  const cursors: Record<Tool, string> = { hand: dragging ? 'grabbing' : 'grab', picker: 'crosshair', zoom: 'zoom-in' };
  return { handlers, cursor: cursors[effective], effectiveTool: effective };
}
