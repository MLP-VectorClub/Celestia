import { useEffect } from 'react';

interface Handlers {
  onOpen: () => void;
  onOpenClipboard: () => void;
}

/** Ctrl/Cmd+O opens the file dialog, with Shift it opens from the clipboard. Other shortcuts are added with the features they belong to */
export function usePickerShortcuts({ onOpen, onOpenClipboard }: Handlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== 'o') return;
      e.preventDefault();
      if (e.shiftKey) onOpenClipboard();
      else onOpen();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onOpen, onOpenClipboard]);
}
