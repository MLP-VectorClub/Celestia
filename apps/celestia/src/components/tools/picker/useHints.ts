import { FocusEvent, MouseEvent, useState } from 'react';

const hintOf = (target: EventTarget | null): string | null =>
  target instanceof Element ? (target.closest('[data-hint]')?.getAttribute('data-hint') ?? null) : null;

/**
 * Explanations for the controls: any element with a `data-hint` shows its text in the status bar while hovered or focused.
 * Spread the returned handlers on a common ancestor
 */
export function useHints() {
  const [hint, setHint] = useState<string | null>(null);
  return {
    hint,
    handlers: {
      onMouseOver: (e: MouseEvent) => setHint(hintOf(e.target)),
      onMouseOut: (e: MouseEvent) => setHint(hintOf(e.relatedTarget)),
      onFocus: (e: FocusEvent) => setHint(hintOf(e.target)),
      onBlur: (e: FocusEvent) => setHint(hintOf(e.relatedTarget)),
    },
  };
}
