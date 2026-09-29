import { useSyncExternalStore } from 'react';
import { BuildIdParseResult, getBuildData } from 'src/utils';

let cachedBuildData: BuildIdParseResult | undefined;

// The build ID never changes while the page is open, so there's nothing to subscribe to
const subscribe = () => () => {};

const getSnapshot = () => {
  cachedBuildData ??= getBuildData();
  return cachedBuildData;
};

const getServerSnapshot = () => null;

/**
 * Build data is read from window.__NEXT_DATA__, which only exists in the browser. React renders
 * with the server snapshot (null) while hydrating, so the markup matches what the server sent,
 * then re-renders with the real value.
 */
export const useBuildData = (): BuildIdParseResult | null => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
