import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { OwnAccountGate } from 'src/components/users/OwnAccountGate';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({ signedIn: false, userId: null as number | null, replace: vi.fn(), dispatch: vi.fn() }));

vi.mock('next/router', () => ({ useRouter: () => ({ replace: state.replace }) }));
vi.mock('src/hooks', () => ({
  useAuth: () => ({ signedIn: state.signedIn, user: { id: state.userId } }),
  useTitleSetter: () => undefined,
}));
vi.mock('src/store', () => ({ useAppDispatch: () => state.dispatch }));
vi.mock('src/store/slices', () => ({ authActions: { openAuthModal: (side: unknown) => ({ type: 'auth/openAuthModal', payload: side }) } }));
vi.mock('src/components/shared/Content', () => ({ default: ({ children }: { children: unknown }) => <main>{children as never}</main> }));

const renderPage = () =>
  render(
    <IntlTestProvider>
      <OwnAccountGate />
    </IntlTestProvider>
  );

describe('/users/account', () => {
  beforeEach(() => {
    state.signedIn = false;
    state.userId = null;
    state.replace.mockClear();
    state.dispatch.mockClear();
  });

  it('asks a visitor who is not signed in to sign in, right away and with a button for when the dialog was closed', async () => {
    const screen = await renderPage();
    await expect.element(screen.getByText(/Sign in to change your account settings/)).toBeVisible();
    expect(state.dispatch).toHaveBeenCalledTimes(1);
    expect(state.dispatch.mock.calls[0][0]).toMatchObject({ type: expect.stringContaining('openAuthModal') });

    await screen.getByRole('button', { name: 'Sign in' }).click();
    expect(state.dispatch).toHaveBeenCalledTimes(2);
    expect(state.replace).not.toHaveBeenCalled();
  });

  it('takes a signed in visitor to the password section of their own account page', async () => {
    state.signedIn = true;
    state.userId = 42;
    await renderPage();
    expect(state.replace).toHaveBeenCalledWith('/users/42/account#security');
    expect(state.dispatch).not.toHaveBeenCalled();
  });
});
