import { useRef } from 'react';

/**
 * The decoded images of the open tabs, by file hash. Kept outside the reducer state because they are large and not serializable,
 * and a plain ref is enough since changes always go together with a dispatched action
 */
export function useImageStore() {
  const images = useRef(new Map<string, HTMLImageElement>());
  return images.current;
}

export type ImageStore = ReturnType<typeof useImageStore>;
