import { afterEach, describe, expect, it, vi } from 'vitest';

import { getBuildData } from 'src/utils/build-id-parser';

describe('getBuildData', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('reads the commit and its time from the build info of next.config.js', () => {
    vi.stubEnv('NEXT_PUBLIC_BUILD_ID', '640e384;1791399609');
    vi.stubGlobal('window', { __NEXT_DATA__: { buildId: 'development' } });

    expect(getBuildData()).toEqual({ commitId: '640e384', commitTime: new Date(1791399609e3) });
  });

  it('falls back to the build ID of Next.js, and hands back what it cannot read', () => {
    vi.stubEnv('NEXT_PUBLIC_BUILD_ID', '');
    vi.stubGlobal('window', { __NEXT_DATA__: { buildId: 'abc123;1700000000' } });
    expect(getBuildData()).toEqual({ commitId: 'abc123', commitTime: new Date(1700000000e3) });

    vi.stubGlobal('window', { __NEXT_DATA__: { buildId: 'development' } });
    expect(getBuildData()).toBe('development');
  });
});
