import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { useRateLimitLock } from 'src/hooks/rate-limit';
import { UnifiedErrorResponse, UnifiedErrorResponseTypes } from 'src/types';

const Probe = ({ error }: { error: UnifiedErrorResponse | null }) => <button disabled={useRateLimitLock(error)}>Sign in</button>;

const limited = (retryAfter: number): UnifiedErrorResponse => ({ type: UnifiedErrorResponseTypes.RATE_LIMITED, retryAfter });

describe('useRateLimitLock', () => {
  it('is not locked without an error', async () => {
    const screen = await render(<Probe error={null} />);
    await expect.element(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('locks while rate limited and unlocks by itself after the wait, without any other interaction', async () => {
    const screen = await render(<Probe error={limited(1)} />);
    const button = screen.getByRole('button', { name: 'Sign in' });
    await expect.element(button).toBeDisabled();
    await expect.element(button, { timeout: 3000 }).toBeEnabled();
  });

  it('locks again for a new rate limit error', async () => {
    const screen = await render(<Probe error={limited(1)} />);
    const button = screen.getByRole('button', { name: 'Sign in' });
    await expect.element(button, { timeout: 3000 }).toBeEnabled();
    await screen.rerender(<Probe error={limited(5)} />);
    await expect.element(button).toBeDisabled();
  });

  it('unlocks right away when the error goes away, and ignores a missing wait time', async () => {
    const screen = await render(<Probe error={limited(60)} />);
    const button = screen.getByRole('button', { name: 'Sign in' });
    await expect.element(button).toBeDisabled();
    await screen.rerender(<Probe error={null} />);
    await expect.element(button).toBeEnabled();
    await screen.rerender(<Probe error={limited(NaN)} />);
    await expect.element(button).toBeEnabled();
  });
});
