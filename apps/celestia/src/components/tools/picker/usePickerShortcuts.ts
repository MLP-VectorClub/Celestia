import { useEffect } from 'react';

import { Tool } from 'src/utils/picker/reducer';

interface Handlers {
  onOpen: () => void;
  onOpenClipboard: () => void;
  onTool: (tool: Tool) => void;
  onFit: () => void;
  onOriginal: () => void;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));

const TOOL_KEYS: Record<string, Tool> = { h: 'hand', i: 'picker', z: 'zoom' };

/**
 * Ctrl/Cmd+O opens the file dialog (with Shift: from the clipboard), H/I/Z pick a tool, Ctrl/Cmd+0 fits the image and Ctrl/Cmd+1 shows it at 100%.
 * Tool keys are ignored while typing in a field
 */
export function usePickerShortcuts({ onOpen, onOpenClipboard, onTool, onFit, onOriginal }: Handlers) {
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
        }
        return;
      }
      if (e.altKey || e.shiftKey || isTyping(e.target)) return;
      const tool = TOOL_KEYS[key];
      if (tool) onTool(tool);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onOpen, onOpenClipboard, onTool, onFit, onOriginal]);
}
