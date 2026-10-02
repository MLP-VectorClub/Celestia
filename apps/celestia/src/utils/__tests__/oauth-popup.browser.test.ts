import { afterEach, describe, expect, it, vi } from 'vitest';

import { listenForOAuthResult, reportOAuthSuccess } from 'src/utils/oauth-popup';

describe('oauth popup channel', () => {
  const cleanups: VoidFunction[] = [];
  afterEach(() => cleanups.splice(0).forEach((fn) => fn()));

  it('tells the opener about a finished sign-in and lets the popup close once it is acknowledged', async () => {
    const onSuccess = vi.fn();
    const onAcknowledged = vi.fn();
    cleanups.push(listenForOAuthResult(onSuccess));
    cleanups.push(reportOAuthSuccess(onAcknowledged));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(onAcknowledged).toHaveBeenCalledTimes(1));
  });

  it('does not let the popup close when nobody is listening', async () => {
    const onAcknowledged = vi.fn();
    cleanups.push(reportOAuthSuccess(onAcknowledged));
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(onAcknowledged).not.toHaveBeenCalled();
  });

  it('reports a result only once', async () => {
    const onSuccess = vi.fn();
    cleanups.push(listenForOAuthResult(onSuccess));
    cleanups.push(reportOAuthSuccess(vi.fn()));
    cleanups.push(reportOAuthSuccess(vi.fn()));
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('stops listening when asked, and a new listener replaces the old one', async () => {
    const stopped = vi.fn();
    const replaced = vi.fn();
    const current = vi.fn();
    listenForOAuthResult(stopped)();
    listenForOAuthResult(replaced);
    cleanups.push(listenForOAuthResult(current));

    cleanups.push(reportOAuthSuccess(vi.fn()));
    await vi.waitFor(() => expect(current).toHaveBeenCalledTimes(1));
    expect(stopped).not.toHaveBeenCalled();
    expect(replaced).not.toHaveBeenCalled();
  });

  it('works through window.opener when BroadcastChannel is missing', async () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const onSuccess = vi.fn();
    const onAcknowledged = vi.fn();
    cleanups.push(listenForOAuthResult(onSuccess));
    // Same page stands in for the opener window here
    const originalOpener = Object.getOwnPropertyDescriptor(window, 'opener');
    Object.defineProperty(window, 'opener', { value: window, configurable: true });
    try {
      cleanups.push(reportOAuthSuccess(onAcknowledged));
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onAcknowledged).toHaveBeenCalledTimes(1);
    } finally {
      if (originalOpener) Object.defineProperty(window, 'opener', originalOpener);
      vi.unstubAllGlobals();
    }
  });
});
