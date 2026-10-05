import { useCallback, useSyncExternalStore } from 'react';

/**
 * What a click on a color square does. Both settings are the visitor's, kept in the browser like the old site did: the `#` is copied unless
 * `leavehash` is set, and `clickrgb` (new, for touch screens and keyboards that cannot Shift+click) shows the RGB values instead of copying.
 */
const LEAVE_HASH = 'leavehash';
const CLICK_RGB = 'clickrgb';
const listeners = new Set<() => void>();
// Settings that could not be stored (blocked storage) last until the page closes
const memory: Record<string, boolean> = {};

const read = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};
const write = (key: string, on: boolean) => {
  try {
    if (on) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  } catch {
    /* storage can be blocked, the setting then lasts until the page closes */
    memory[key] = on;
  }
  listeners.forEach((listener) => listener());
};
const get = (key: string) => (key in memory ? memory[key] : read(key));

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

export function useColorCopySettings() {
  const leaveHash = useSyncExternalStore(
    subscribe,
    () => get(LEAVE_HASH),
    () => false
  );
  const rgbOnClick = useSyncExternalStore(
    subscribe,
    () => get(CLICK_RGB),
    () => false
  );
  const setCopyHash = useCallback((copyHash: boolean) => write(LEAVE_HASH, !copyHash), []);
  const setRgbOnClick = useCallback((on: boolean) => write(CLICK_RGB, on), []);
  return { copyHash: !leaveHash, rgbOnClick, setCopyHash, setRgbOnClick };
}
