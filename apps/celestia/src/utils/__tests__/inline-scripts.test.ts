import { describe, expect, it } from 'vitest';

import { findExecutableInlineScripts } from '../../../scripts/inline-scripts.mjs';

describe('findExecutableInlineScripts', () => {
  it('finds the inline bootstrap that Next 16.4 emits by default and our CSP blocks', () => {
    const html = '<body><script>(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push({"otherChunks": ["a.js"]});</script></body>';
    expect(findExecutableInlineScripts(html)).toHaveLength(1);
  });

  it('finds an inline script with attributes, but not an external one', () => {
    expect(findExecutableInlineScripts('<script id="x" async>run()</script><script src="/a.js"></script>')).toHaveLength(1);
    expect(findExecutableInlineScripts('<script src="/a.js" defer></script>')).toEqual([]);
  });

  it('leaves data blocks alone: they are not executed', () => {
    const html = '<script id="__NEXT_DATA__" type="application/json">{"a":1}</script><script type="application/ld+json">{}</script>';
    expect(findExecutableInlineScripts(html)).toEqual([]);
  });
});
