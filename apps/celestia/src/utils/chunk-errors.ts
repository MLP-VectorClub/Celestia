/** Messages of a failed code split chunk: webpack ("Loading chunk 12 failed"), Turbopack ("Failed to load chunk /_next/static/..."), native dynamic imports and Next's own script loader */
const CHUNK_FAILURE = [
  /loading (css )?chunk .+ failed/i,
  /failed to load chunk/i,
  /failed to load script/i,
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
];

export const isChunkLoadError = (error: unknown): boolean => {
  if (!error) return false;
  const err = error as { name?: string; message?: string };
  const message = err.message || String(error);
  return err.name === 'ChunkLoadError' || CHUNK_FAILURE.some((pattern) => pattern.test(message));
};

/**
 * A script or stylesheet of the app's own build that the browser could not load (a failed resource does not reach `window.onerror` as an error object,
 * only as an `error` event on the element, which is seen by listening in the capture phase)
 */
export const isBuildAssetFailure = (target: EventTarget | null): boolean => {
  if (!target || typeof (target as Element).tagName !== 'string') return false;
  const element = target as HTMLScriptElement | HTMLLinkElement;
  const url = element.tagName === 'SCRIPT' ? (element as HTMLScriptElement).src : element.tagName === 'LINK' ? (element as HTMLLinkElement).href : '';
  return url !== '' && url.includes('/_next/static/');
};
