import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import ForgotPasswordForm from 'src/components/shared/forms/ForgotPasswordForm';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({ dispatch: vi.fn(), forgot: vi.fn() }));

vi.mock('src/hooks', async () => ({ ...(await vi.importActual<object>('src/hooks/mutation')) }));
vi.mock('src/hooks/rate-limit', () => ({ useRateLimitLock: () => false }));
vi.mock('src/services/user', () => ({ UserService: { forgotPassword: (email: string) => state.forgot(email) } }));
vi.mock('src/store', () => ({ useAppDispatch: () => state.dispatch }));
vi.mock('src/store/slices', () => ({ authActions: { openAuthModal: (side: unknown) => ({ type: 'open', side }) } }));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));

const renderForm = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlTestProvider>
        <ForgotPasswordForm />
      </IntlTestProvider>
    </QueryClientProvider>
  );

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    state.dispatch.mockReset();
    state.forgot.mockReset();
  });

  it('asks for the address, then says a link was sent without saying whether the address is known', async () => {
    state.forgot.mockResolvedValue({ data: { message: 'ok' } });
    const screen = await renderForm();

    await screen.getByLabelText('E-Mail Address').fill('  pony@example.com ');
    await screen.getByRole('button', { name: 'Send the link' }).click();

    expect(state.forgot).toHaveBeenCalledWith('pony@example.com');
    await expect.element(screen.getByText(/If an account uses that e-mail address/)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Send the link' })).not.toBeInTheDocument();
  });

  it('does not send an empty address', async () => {
    const screen = await renderForm();
    await expect.element(screen.getByRole('button', { name: 'Send the link' })).toBeDisabled();
  });

  it('shows what the API says when it refuses', async () => {
    state.forgot.mockRejectedValue({
      isAxiosError: true,
      response: { status: 503, data: { message: 'Mail is down' }, headers: {} },
    });
    const screen = await renderForm();
    await screen.getByLabelText('E-Mail Address').fill('pony@example.com');
    await screen.getByRole('button', { name: 'Send the link' }).click();

    await expect.element(screen.getByRole('alert')).toBeVisible();
  });

  it('goes back to the sign in form', async () => {
    const screen = await renderForm();
    await screen.getByRole('button', { name: 'Back to sign in' }).click();
    expect(state.dispatch).toHaveBeenCalledWith({ type: 'open', side: 0 });
  });
});
