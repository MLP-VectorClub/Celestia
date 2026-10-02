import { useEffect } from 'react';

import { Tool } from 'src/utils/picker/reducer';

interface Handlers {
  onOpen: () => void;
  onOpenClipboard: () => void;
  onTool: (tool: Tool) => void;
  onFit: () => void;
  onOriginal: () => void;
  onSelectAll: (selected: boolean) => void;
  onDeleteSelected: () => void;
  /** Change the picking area size by this many pixels */
  onSizeStep: (delta: number) => void;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));

const TOOL_KEYS: Record<string, Tool> = { h: 'hand', i: 'picker', z: 'zoom' };

/**
 * Ctrl/Cmd+O opens the file dialog (with Shift: from the clipboard), H/I/Z pick a tool, Ctrl/Cmd+0 fits the image and Ctrl/Cmd+1 shows it at 100%,
 * Ctrl/Cmd+A selects all picking areas (with Shift: none), Delete removes the selected ones and the up/down arrows change the picking size by 5 (with Ctrl/Cmd by 1).
 * All of these are ignored while typing in a field
 */
export function usePickerShortcuts({
  onOpen,
  onOpenClipboard,
  onTool,
  onFit,
  onOriginal,
  onSelectAll,
  onDeleteSelected,
  onSizeStep,
}: Handlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (key === 'o') {
          e.preventDefault();
          if (e.shiftKey) onOpenClipboard();
          else onOpen();
        } else if (key === '0' && !isTyping(e.target)) {
          e.preventDefault();
          onFit();
        } else if (key === '1' && !isTyping(e.target)) {
          e.preventDefault();
          onOriginal();
        } else if (key === 'a' && !isTyping(e.target)) {
          e.preventDefault();
          onSelectAll(!e.shiftKey);
        } else if ((key === 'arrowup' || key === 'arrowdown') && !isTyping(e.target)) {
          e.preventDefault();
          onSizeStep(key === 'arrowup' ? 1 : -1);
        }
        return;
      }
      if (e.altKey || e.shiftKey || isTyping(e.target)) return;
      if (key === 'delete' || key === 'backspace') {
        e.preventDefault();
        onDeleteSelected();
        return;
      }
      if (key === 'arrowup' || key === 'arrowdown') {
        e.preventDefault();
        onSizeStep(key === 'arrowup' ? 5 : -5);
        return;
      }
      const tool = TOOL_KEYS[key];
      if (tool) onTool(tool);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onOpen, onOpenClipboard, onTool, onFit, onOriginal, onSelectAll, onDeleteSelected, onSizeStep]);
}
