import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { ThemeChoice, colorSchemeContent, isExplicitTheme, parseTheme, serializeThemeCookie } from 'src/utils/theme';

const listeners = new Set<() => void>();

/** The theme the page was rendered with: the server put it on `<html>` (see `_document.tsx`), so this is also what hydration saw */
const read = (): ThemeChoice => {
  const attribute = document.documentElement.getAttribute('data-bs-theme');
  return isExplicitTheme(attribute) ? attribute : 'system';
};

const showTheme = (choice: ThemeChoice) => {
  const root = document.documentElement;
  if (isExplicitTheme(choice)) root.setAttribute('data-bs-theme', choice);
  else root.removeAttribute('data-bs-theme');
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', colorSchemeContent(choice));
  listeners.forEach((listener) => listener());
};

/** Applies a choice to the page right away and keeps it in the cookie the server reads on the next load */
export function applyTheme(choice: ThemeChoice) {
  showTheme(choice);
  document.cookie = serializeThemeCookie(choice, location.protocol === 'https:');
}

/**
 * Pages that were not rendered for this visitor (the 404 page is the same file for everybody) come without the saved theme on `<html>`: show
 * the cookie's choice once the page is running. The server does this itself for every other page (`_document.tsx`)
 */
export function useSavedTheme() {
  useEffect(() => {
    const saved = parseTheme(document.cookie);
    if (saved !== read()) showTheme(saved);
  }, []);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'system' as const);
  const setTheme = useCallback((choice: ThemeChoice) => applyTheme(choice), []);
  return { theme, setTheme };
}
