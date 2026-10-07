import { describe, expect, it } from 'vitest';

import { isBuildAssetFailure, isChunkLoadError } from 'src/utils/chunk-errors';

describe('isChunkLoadError', () => {
  it.each([
    { name: 'ChunkLoadError', message: 'anything' },
    new Error('Loading chunk 123 failed.'),
    new Error('Loading CSS chunk 9 failed.'),
    new Error('Failed to load chunk /_next/static/chunks/abc.js from module 1234'),
    new Error('Failed to load script: /_next/static/chunks/pages/cg.js'),
    new TypeError('Failed to fetch dynamically imported module: https://x/_next/static/a.js'),
  ])('recognises %j', (error) => expect(isChunkLoadError(error)).toBe(true));

  it.each([null, undefined, new Error('Cannot read properties of undefined'), 'network down'])('ignores %j', (error) =>
    expect(isChunkLoadError(error)).toBe(false)
  );
});

describe('isBuildAssetFailure', () => {
  const element = (tagName: string, urlProp: 'src' | 'href', url: string) => ({ tagName, [urlProp]: url }) as unknown as EventTarget;

  it('only counts the app build assets', () => {
    expect(isBuildAssetFailure(element('SCRIPT', 'src', 'https://next.example/_next/static/chunks/a.js'))).toBe(true);
    expect(isBuildAssetFailure(element('LINK', 'href', 'https://next.example/_next/static/css/a.css'))).toBe(true);
    expect(isBuildAssetFailure(element('SCRIPT', 'src', 'https://other.example/analytics.js'))).toBe(false);
    expect(isBuildAssetFailure(element('IMG', 'src', 'https://next.example/_next/static/a.png'))).toBe(false);
    expect(isBuildAssetFailure(null)).toBe(false);
    expect(isBuildAssetFailure({} as EventTarget)).toBe(false);
  });
});
