import { useEffect, useState } from 'react';

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));

/**
 * Whether one of the keys (`KeyboardEvent.code`) is held down. Releasing the window focus counts as releasing the key.
 * With `ignoreTyping` presses inside text fields are ignored, `preventDefault` stops the browser scrolling on Space
 */
export function useKeyHeld(codes: string[], { ignoreTyping = false, preventDefault = false } = {}): boolean {
  const [held, setHeld] = useState(false);
  const key = codes.join(',');

  useEffect(() => {
    const list = key.split(',');
    const down = (e: KeyboardEvent) => {
      if (!list.includes(e.code) || (ignoreTyping && isTyping(e.target))) return;
      if (preventDefault) e.preventDefault();
      setHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (list.includes(e.code)) setHeld(false);
    };
    const release = () => setHeld(false);
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    window.addEventListener('blur', release);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
      window.removeEventListener('blur', release);
    };
  }, [key, ignoreTyping, preventDefault]);

  return held;
}
