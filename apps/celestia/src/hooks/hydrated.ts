import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

/**
 * `false` in the server's HTML and during hydration, `true` once the page is running in the browser. For controls that need JavaScript to do
 * anything: render them disabled until then. Both the server and the first browser render say `false`, so hydration finds the same markup and
 * React then updates the page, which is why this is not a `useEffect` + `useState` pair or a `typeof window` check
 */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
