import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import TwoFactorForm from 'src/components/shared/forms/TwoFactorForm';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';
import { Status, UnifiedErrorResponseTypes } from 'src/types';

const state = vi.hoisted(() => ({
  dispatch: vi.fn(),
  twoFactor: {} as Record<string, unknown>,
  passkeyOptions: vi.fn(),
  signInWithPasskeyOptions: vi.fn(),
}));

const challenge = { challenge: 'token', methods: ['totp', 'recovery', 'passkey'] };
const setState = (overrides: Record<string, unknown> = {}) => {
  state.twoFactor = { challenge, status: Status.INIT, error: null, ...overrides };
};

vi.mock('react-redux', () => ({ useSelector: (select: (s: unknown) => unknown) => select({ auth: { twoFactor: state.twoFactor } }) }));
vi.mock('src/store', () => ({ useAppDispatch: () => state.dispatch }));
vi.mock('src/store/slices', () => ({
  authActions: { backToSignIn: () => ({ type: 'back' }), clearTwoFactorError: () => ({ type: 'clear' }) },
}));
vi.mock('src/store/thunks', () => ({
  signInTwoFactorThunk: (args: unknown) => ({ type: 'code', args }),
  signInTwoFactorPasskeyThunk: (args: unknown) => ({ type: 'passkey', args }),
}));
vi.mock('src/services/user', () => ({ UserService: { twoFactorPasskeyOptions: (c: string) => state.passkeyOptions(c) } }));
vi.mock('src/utils/passkeys', () => ({
  signInWithPasskeyOptions: (o: unknown) => state.signInWithPasskeyOptions(o),
}));
vi.mock('src/hooks', () => ({
  describeApiError: () => 'Something went wrong',
  passkeyErrorMessage: (e: { message?: string }, fallback: string) => (e.message === 'closed' ? null : fallback),
  usePasskeysSupported: () => true,
}));
vi.mock('src/hooks/rate-limit', () => ({ useRateLimitLock: () => false }));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));

const renderForm = () =>
  render(
    <IntlTestProvider>
      <TwoFactorForm />
    </IntlTestProvider>
  );

describe('TwoFactorForm', () => {
  beforeEach(() => {
    state.dispatch.mockReset().mockResolvedValue({});
    state.passkeyOptions.mockReset();
    state.signInWithPasskeyOptions.mockReset();
    setState();
  });

  it('answers the challenge with the code from the authenticator app', async () => {
    const screen = await renderForm();
    await screen.getByLabelText('Code from your authenticator app').fill('123 456');
    await screen.getByRole('button', { name: 'Verify' }).click();

    expect(state.dispatch).toHaveBeenCalledWith({ type: 'code', args: { challenge: 'token', code: '123 456' } });
  });

  it('does not submit an empty code', async () => {
    const screen = await renderForm();
    await expect.element(screen.getByRole('button', { name: 'Verify' })).toBeDisabled();
  });

  it('switches to a recovery code, which is sent as one', async () => {
    const screen = await renderForm();
    await screen.getByRole('button', { name: 'Use a recovery code instead' }).click();
    await screen.getByLabelText('Recovery code').fill('abcde-fghij');
    await screen.getByRole('button', { name: 'Verify' }).click();

    expect(state.dispatch).toHaveBeenCalledWith({ type: 'code', args: { challenge: 'token', recoveryCode: 'abcde-fghij' } });
  });

  it('says the code was wrong, and that the sign in has to start over once the challenge ran out', async () => {
    setState({ error: { type: UnifiedErrorResponseTypes.AUTHENTICATION_ERROR } });
    let screen = await renderForm();
    await expect.element(screen.getByText(/That code is not right/)).toBeVisible();
    await screen.unmount();

    setState({ error: { type: UnifiedErrorResponseTypes.AUTHENTICATION_ERROR, expired: true } });
    screen = await renderForm();
    await expect.element(screen.getByText(/Please start over/)).toBeVisible();
    await screen.getByRole('button', { name: 'Start over' }).click();
    expect(state.dispatch).toHaveBeenCalledWith({ type: 'back' });
  });

  it('answers with a passkey: options for the challenge, the browser prompt, then the credential', async () => {
    state.passkeyOptions.mockResolvedValue({ data: { options: { challenge: 'x' }, challenge: 'passkey-token' } });
    state.signInWithPasskeyOptions.mockResolvedValue({ id: 'credential' });
    const screen = await renderForm();
    await screen.getByRole('button', { name: 'Use a passkey instead' }).click();

    await vi.waitFor(() =>
      expect(state.dispatch).toHaveBeenCalledWith({
        type: 'passkey',
        args: { challenge: 'token', passkeyChallenge: 'passkey-token', credential: { id: 'credential' } },
      })
    );
    expect(state.passkeyOptions).toHaveBeenCalledWith('token');
    expect(state.signInWithPasskeyOptions).toHaveBeenCalledWith({ challenge: 'x' });
  });

  it('stays quiet when the visitor closes the browser prompt, and says so when the passkey does not work', async () => {
    state.passkeyOptions.mockResolvedValue({ data: { options: {}, challenge: 'p' } });
    state.signInWithPasskeyOptions.mockRejectedValueOnce({ message: 'closed' }).mockRejectedValueOnce({ message: 'broken' });
    const screen = await renderForm();

    await screen.getByRole('button', { name: 'Use a passkey instead' }).click();
    await vi.waitFor(() => expect(state.signInWithPasskeyOptions).toHaveBeenCalledTimes(1));
    await expect.element(screen.getByText(/Could not use a passkey/)).not.toBeInTheDocument();

    await screen.getByRole('button', { name: 'Use a passkey instead' }).click();
    await expect.element(screen.getByText(/Could not use a passkey/)).toBeVisible();
    expect(state.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'passkey' }));
  });

  it('offers no passkey when the account has none', async () => {
    setState({ challenge: { challenge: 'token', methods: ['totp', 'recovery'] } });
    const screen = await renderForm();
    await expect.element(screen.getByRole('button', { name: 'Use a passkey instead' })).not.toBeInTheDocument();
  });

  it('goes back to the sign in form when there is nothing to answer', async () => {
    setState({ challenge: null });
    await renderForm();
    await vi.waitFor(() => expect(state.dispatch).toHaveBeenCalledWith({ type: 'back' }));
  });
});
