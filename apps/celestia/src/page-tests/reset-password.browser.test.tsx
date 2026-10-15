import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import ResetPasswordPage from 'src/pages/users/reset-password';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const TOKEN = 'a1'.repeat(32);
const state = vi.hoisted(() => ({ query: {} as Record<string, string>, dispatch: vi.fn(), reset: vi.fn() }));

vi.mock('next/router', () => ({ useRouter: () => ({ query: state.query }) }));
vi.mock('src/hooks', async () => ({ ...(await vi.importActual<object>('src/hooks/mutation')), useTitleSetter: () => undefined }));
vi.mock('src/services/user', () => ({ UserService: { resetPassword: (data: unknown) => state.reset(data) } }));
vi.mock('src/store', () => ({ useAppDispatch: () => state.dispatch, wrapper: { getServerSideProps: () => () => undefined } }));
vi.mock('src/store/slices', () => ({ authActions: { openAuthModal: (side: unknown) => ({ type: 'open', side }) } }));
vi.mock('src/utils/core', () => ({ titleSetter: () => undefined }));
vi.mock('src/utils/i18n', () => ({ typedServerSideTranslations: () => ({}) }));
vi.mock('src/components/shared/Content', () => ({ default: ({ children }: { children: unknown }) => <div>{children as never}</div> }));
vi.mock('src/components/shared/StandardHeading', () => ({ default: ({ heading }: { heading: string }) => <h1>{heading}</h1> }));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlTestProvider>
        <ResetPasswordPage />
      </IntlTestProvider>
    </QueryClientProvider>
  );

describe('reset password page', () => {
  beforeEach(() => {
    state.dispatch.mockReset();
    state.reset.mockReset();
    state.query = { token: TOKEN };
  });

  it('sets the new password with the token of the link, then offers to sign in', async () => {
    state.reset.mockResolvedValue({ data: { message: 'done' } });
    const screen = await renderPage();

    await screen.getByLabelText('New password').fill('a-brand-new-password-1');
    await screen.getByRole('button', { name: 'Set the new password' }).click();

    expect(state.reset).toHaveBeenCalledWith({ token: TOKEN, newPassword: 'a-brand-new-password-1' });
    await expect.element(screen.getByText(/Your new password is set/)).toBeVisible();
    await screen.getByRole('button', { name: 'Sign in' }).click();
    expect(state.dispatch).toHaveBeenCalledWith({ type: 'open', side: 0 });
  });

  it('will not send a password that is too short', async () => {
    const screen = await renderPage();
    await screen.getByLabelText('New password').fill('short');
    await expect.element(screen.getByRole('button', { name: 'Set the new password' })).toBeDisabled();
  });

  it('says so, and offers a new link, when the link has expired or was used', async () => {
    state.reset.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: { message: 'x', errors: { token: ['This link has expired or was already used, please ask for a new one'] } },
        headers: {},
      },
    });
    const screen = await renderPage();
    await screen.getByLabelText('New password').fill('a-brand-new-password-1');
    await screen.getByRole('button', { name: 'Set the new password' }).click();

    await expect.element(screen.getByText(/has expired or was already used/)).toBeVisible();
    await screen.getByRole('button', { name: 'Ask for a new link' }).click();
    expect(state.dispatch).toHaveBeenCalledWith({ type: 'open', side: 2 });
  });

  it('shows the field message of a password that is not acceptable', async () => {
    state.reset.mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { message: 'x', errors: { newPassword: ['This password has been in a data breach'] } }, headers: {} },
    });
    const screen = await renderPage();
    await screen.getByLabelText('New password').fill('password12345');
    await screen.getByRole('button', { name: 'Set the new password' }).click();

    await expect.element(screen.getByText('This password has been in a data breach')).toBeVisible();
  });

  it('refuses a link without a proper token and sends nothing', async () => {
    state.query = { token: 'nonsense' };
    const screen = await renderPage();

    await expect.element(screen.getByText(/This link is not complete/)).toBeVisible();
    await expect.element(screen.getByLabelText('New password')).not.toBeInTheDocument();
  });
});
