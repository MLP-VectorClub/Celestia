import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { FetchFailureView } from 'src/components/shared/FetchFailureView';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({ signedIn: false, replace: vi.fn(), dispatch: vi.fn() }));

vi.mock('next/router', () => ({ useRouter: () => ({ replace: state.replace, asPath: '/users/1/account' }) }));
vi.mock('src/hooks', () => ({ useAuth: () => ({ signedIn: state.signedIn }), useTitleSetter: () => undefined }));
vi.mock('src/hooks/rate-limit', () => ({ useRateLimitLock: () => false }));
vi.mock('src/store', () => ({ useAppDispatch: () => state.dispatch }));
vi.mock('src/store/slices', () => ({ authActions: { openAuthModal: (side: unknown) => ({ type: 'auth/openAuthModal', payload: side }) } }));
vi.mock('src/components/shared/Content', () => ({ default: ({ children }: { children: unknown }) => <main>{children as never}</main> }));

const renderView = (status: number) =>
  render(
    <IntlTestProvider>
      <FetchFailureView failure={{ status, retryAfter: null }} />
    </IntlTestProvider>
  );

describe('FetchFailureView for a refused page', () => {
  beforeEach(() => {
    state.signedIn = false;
    state.replace.mockReset().mockResolvedValue(true);
    state.dispatch.mockClear();
  });

  it('asks somebody who is not signed in to sign in, with the dialog open and a button for when it was closed', async () => {
    const screen = await renderView(403);
    await expect.element(screen.getByText(/sign in and you will be taken there/)).toBeVisible();
    expect(state.dispatch).toHaveBeenCalledTimes(1);
    await screen.getByRole('button', { name: 'Sign in' }).click();
    expect(state.dispatch).toHaveBeenCalledTimes(2);
    expect(state.replace).not.toHaveBeenCalled();
  });

  it('shows the page the visitor is let into after signing in, by asking the server for it again', async () => {
    const screen = await renderView(403);
    state.signedIn = true;
    await screen.rerender(
      <IntlTestProvider>
        <FetchFailureView failure={{ status: 403, retryAfter: null }} />
      </IntlTestProvider>
    );
    expect(state.replace).toHaveBeenCalledWith('/users/1/account');
  });

  it('leaves somebody who is signed in with their 403, without a sign in button and without asking again', async () => {
    state.signedIn = true;
    const screen = await renderView(403);
    await expect.element(screen.getByText('403 Unauthorized')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(state.dispatch).not.toHaveBeenCalled();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it('does not ask for a sign in on other failures', async () => {
    const screen = await renderView(500);
    await expect.element(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
    expect(state.dispatch).not.toHaveBeenCalled();
  });
});
