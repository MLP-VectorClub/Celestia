import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { TwoFactorSection } from 'src/components/users/account/TwoFactorSection';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({
  status: { enabled: false, recoveryCodesRemaining: 0, passwordSet: true },
  confirm: vi.fn(),
  api: {
    getTwoFactor: vi.fn(),
    startTwoFactor: vi.fn(),
    confirmTwoFactor: vi.fn(),
    regenerateRecoveryCodes: vi.fn(),
    disableTwoFactor: vi.fn(),
  },
}));

vi.mock('src/hooks', async () => ({
  ...(await vi.importActual<object>('src/hooks/mutation')),
  useAuth: () => ({ signedIn: true }),
}));
vi.mock('src/services/account', () => ({ AccountService: state.api }));
vi.mock('src/components/shared/dialogs/DialogProvider', () => ({ useDialog: () => ({ confirm: state.confirm }) }));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));
vi.mock('qrcode', () => ({ toDataURL: () => Promise.resolve('data:image/png;base64,AAAA') }));

const validationError = (field: string, message: string) => ({
  isAxiosError: true,
  response: { status: 422, data: { message, errors: { [field]: [message] } }, headers: {} },
});

const renderSection = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <IntlTestProvider>
        <TwoFactorSection />
      </IntlTestProvider>
    </QueryClientProvider>
  );

describe('TwoFactorSection', () => {
  beforeEach(() => {
    Object.values(state.api).forEach((fn) => fn.mockReset());
    state.confirm.mockReset().mockResolvedValue(true);
    state.status = { enabled: false, recoveryCodesRemaining: 0, passwordSet: true };
    state.api.getTwoFactor.mockImplementation(() => Promise.resolve({ data: state.status }));
  });

  it('sets up an authenticator app: password, the QR code and key, a code from the app, then the recovery codes once', async () => {
    state.api.startTwoFactor.mockResolvedValue({
      data: { secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/Club:me?secret=JBSWY3DPEHPK3PXP' },
    });
    state.api.confirmTwoFactor.mockImplementation(() => {
      state.status = { enabled: true, recoveryCodesRemaining: 2, passwordSet: true };
      return Promise.resolve({ data: { recoveryCodes: ['aaaaa-bbbbb', 'ccccc-ddddd'] } });
    });
    const screen = await renderSection();

    await screen.getByLabelText('Your current password').fill('hunter2hunter2');
    await screen.getByRole('button', { name: 'Set up' }).click();
    expect(state.api.startTwoFactor).toHaveBeenCalledWith({ currentPassword: 'hunter2hunter2' });

    await expect.element(screen.getByText('JBSWY3DPEHPK3PXP')).toBeVisible();
    await expect.element(screen.getByAltText('QR code for your authenticator app')).toBeVisible();

    await screen.getByLabelText('Code from the app').fill('123 456');
    await screen.getByRole('button', { name: 'Turn on' }).click();
    expect(state.api.confirmTwoFactor).toHaveBeenCalledWith('123456');

    await expect.element(screen.getByText('aaaaa-bbbbb')).toBeVisible();
    await expect.element(screen.getByText(/will not be shown again/)).toBeVisible();

    await screen.getByRole('button', { name: 'I saved them' }).click();
    await expect.element(screen.getByText(/Two-step verification is on. You have 2 unused recovery codes/)).toBeVisible();
    await expect.element(screen.getByText('aaaaa-bbbbb')).not.toBeInTheDocument();
  });

  it('shows what is wrong with the password, and with the code', async () => {
    state.api.startTwoFactor.mockRejectedValue(validationError('currentPassword', 'The current password is incorrect'));
    const screen = await renderSection();
    await screen.getByLabelText('Your current password').fill('nope');
    await screen.getByRole('button', { name: 'Set up' }).click();
    await expect.element(screen.getByText('The current password is incorrect')).toBeVisible();

    state.api.startTwoFactor.mockResolvedValue({ data: { secret: 'ABC', uri: 'otpauth://totp/x' } });
    state.api.confirmTwoFactor.mockRejectedValue(validationError('code', 'That code is not right'));
    await screen.getByRole('button', { name: 'Set up' }).click();
    await screen.getByLabelText('Code from the app').fill('000000');
    await screen.getByRole('button', { name: 'Turn on' }).click();
    await expect.element(screen.getByText('That code is not right')).toBeVisible();
  });

  it('turns off after the visitor confirms, with the password', async () => {
    state.status = { enabled: true, recoveryCodesRemaining: 1, passwordSet: true };
    state.api.disableTwoFactor.mockResolvedValue({ data: undefined });
    const screen = await renderSection();
    await expect.element(screen.getByText(/You have 1 unused recovery code\./)).toBeVisible();

    await screen.getByLabelText('Your current password').fill('hunter2hunter2');
    await screen.getByRole('button', { name: 'Turn off' }).click();

    expect(state.confirm).toHaveBeenCalled();
    await vi.waitFor(() => expect(state.api.disableTwoFactor).toHaveBeenCalledWith({ currentPassword: 'hunter2hunter2' }));
  });

  it('does not turn off when the visitor backs out of the question', async () => {
    state.status = { enabled: true, recoveryCodesRemaining: 1, passwordSet: true };
    state.confirm.mockResolvedValue(false);
    const screen = await renderSection();
    await screen.getByLabelText('Your current password').fill('hunter2hunter2');
    await screen.getByRole('button', { name: 'Turn off' }).click();

    await vi.waitFor(() => expect(state.confirm).toHaveBeenCalled());
    expect(state.api.disableTwoFactor).not.toHaveBeenCalled();
  });

  it('makes new recovery codes and shows them', async () => {
    state.status = { enabled: true, recoveryCodesRemaining: 1, passwordSet: true };
    state.api.regenerateRecoveryCodes.mockResolvedValue({ data: { recoveryCodes: ['eeeee-fffff'] } });
    const screen = await renderSection();
    await screen.getByLabelText('Your current password').fill('hunter2hunter2');
    await screen.getByRole('button', { name: 'Get new recovery codes' }).click();

    expect(state.api.regenerateRecoveryCodes).toHaveBeenCalledWith({ currentPassword: 'hunter2hunter2' });
    await expect.element(screen.getByText('eeeee-fffff')).toBeVisible();
  });

  it('asks an account without a password for a code of the app instead', async () => {
    state.status = { enabled: true, recoveryCodesRemaining: 3, passwordSet: false };
    state.api.disableTwoFactor.mockResolvedValue({ data: undefined });
    const screen = await renderSection();

    await expect.element(screen.getByLabelText('Your current password')).not.toBeInTheDocument();
    await screen.getByLabelText(/A code from your authenticator app/).fill('123456');
    await screen.getByRole('button', { name: 'Turn off' }).click();
    await vi.waitFor(() => expect(state.api.disableTwoFactor).toHaveBeenCalledWith({ code: '123456' }));
  });

  it('asks for nothing when there is neither a password nor an app to prove who is asking', async () => {
    state.status = { enabled: false, recoveryCodesRemaining: 0, passwordSet: false };
    state.api.startTwoFactor.mockResolvedValue({ data: { secret: 'ABC', uri: 'otpauth://totp/x' } });
    const screen = await renderSection();
    await screen.getByRole('button', { name: 'Set up' }).click();
    expect(state.api.startTwoFactor).toHaveBeenCalledWith({});
  });

  it('says so, with a way to try again, when the status could not be loaded', async () => {
    state.api.getTwoFactor.mockRejectedValueOnce({ message: 'nope' }).mockImplementation(() => Promise.resolve({ data: state.status }));
    const screen = await renderSection();
    await screen.getByRole('button', { name: 'Try again' }).click();
    await expect.element(screen.getByRole('button', { name: 'Set up' })).toBeVisible();
  });
});
