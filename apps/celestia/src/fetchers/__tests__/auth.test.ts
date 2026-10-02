import { IncomingMessage } from 'http';
import { describe, expect, it, vi } from 'vitest';

import { requestUserFetcher } from 'src/fetchers/auth';

const request = (headers: Record<string, string>) => ({ headers }) as unknown as IncomingMessage;

describe('requestUserFetcher', () => {
  it('does not ask the API about visitors without credentials', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    expect(await requestUserFetcher(request({}))).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('treats a failed lookup as a guest instead of failing the page', async () => {
    // nothing listens on the API host in the unit test environment, so the lookup fails
    expect(await requestUserFetcher(request({ authorization: 'Bearer nope' }))).toBeNull();
  });
});
