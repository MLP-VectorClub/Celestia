import Router from 'next/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import DeployBanner from 'src/components/shared/DeployBanner';

const emit = (event: Parameters<typeof Router.events.emit>[0], ...args: unknown[]) => Router.events.emit(event, ...args);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('DeployBanner', () => {
  it('is not there while navigation works', async () => {
    const screen = await render(<DeployBanner />);
    emit('routeChangeStart', '/cg');
    emit('routeChangeComplete', '/cg');
    await expect.element(screen.getByText(/deploying an update/)).not.toBeInTheDocument();
  });

  it('ignores a navigation the visitor cancelled themselves', async () => {
    const screen = await render(<DeployBanner />);
    emit('routeChangeError', Object.assign(new Error('Route Cancelled'), { cancelled: true }), '/cg');
    await expect.element(screen.getByText(/deploying an update/)).not.toBeInTheDocument();
  });

  it('appears when a navigation fails, then asks for a reload once the app answers, never reloading by itself', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const screen = await render(<DeployBanner />);

    emit('routeChangeError', new Error('Failed to fetch'), '/cg');
    await expect.element(screen.getByText(/deploying an update/)).toBeVisible();

    // Still down on the first check: the wording stays
    await vi.advanceTimersByTimeAsync(4000);
    await expect.element(screen.getByText(/deploying an update/)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith('/favicon.ico', { method: 'HEAD', cache: 'no-store' });

    await vi.advanceTimersByTimeAsync(4000);
    await expect.element(screen.getByText(/An update has been deployed\. Reload the page to continue/)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Reload' })).toBeVisible();
  });

  it('appears for a chunk that failed to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    const screen = await render(<DeployBanner />);
    window.dispatchEvent(new ErrorEvent('error', { message: 'Loading chunk 123 failed.', error: new Error('Loading chunk 123 failed.') }));
    await expect.element(screen.getByText(/deploying an update/)).toBeVisible();
  });

  it('stops polling when it goes away', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const screen = await render(<DeployBanner />);
    emit('routeChangeError', new Error('Failed to fetch'), '/cg');
    await expect.element(screen.getByText(/deploying an update/)).toBeVisible();
    await screen.unmount();
    await vi.advanceTimersByTimeAsync(20000);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
