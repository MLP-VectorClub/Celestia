import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { PasskeysSection } from 'src/components/users/account/PasskeysSection';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({
  supported: true,
  passkeys: [] as { id: number; name: string; createdAt: string; lastUsedAt: string | null }[],
  status: { enabled: false, recoveryCodesRemaining: 0, passwordSet: true },
  register: vi.fn(),
  api: {
    getPasskeys: vi.fn(),
    getTwoFactor: vi.fn(),
    passkeyRegistrationOptions: vi.fn(),
    registerPasskey: vi.fn(),
    renamePasskey: vi.fn(),
    deletePasskey: vi.fn(),
  },
}));

vi.mock('src/hooks', async () => ({
  ...(await vi.importActual<object>('src/hooks/mutation')),
  useAuth: () => ({ signedIn: true }),
  passkeyErrorMessage: (e: { message?: string }, fallback: string) => (e.message === 'closed' ? null : fallback),
  usePasskeysSupported: () => state.supported,
}));
vi.mock('src/services/account', () => ({ AccountService: state.api }));
vi.mock('src/utils/passkeys', () => ({
  registerPasskeyOptions: (o: unknown) => state.register(o),
  isAlreadyRegistered: (e: { code?: string }) => e.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
}));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));
vi.mock('src/components/shared/TimeAgo', () => ({ default: () => <span>a while ago</span> }));

const renderSection = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <IntlTestProvider>
        <PasskeysSection />
      </IntlTestProvider>
    </QueryClientProvider>
  );

const laptop = { id: 5, name: 'Laptop', createdAt: '2026-10-01T10:00:00Z', lastUsedAt: null };

describe('PasskeysSection', () => {
  beforeEach(() => {
    Object.values(state.api).forEach((fn) => fn.mockReset());
    state.register.mockReset();
    state.supported = true;
    state.passkeys = [];
    state.status = { enabled: false, recoveryCodesRemaining: 0, passwordSet: true };
    state.api.getPasskeys.mockImplementation(() => Promise.resolve({ data: state.passkeys }));
    state.api.getTwoFactor.mockImplementation(() => Promise.resolve({ data: state.status }));
  });

  it('lists the passkeys with when they were made and last used', async () => {
    state.passkeys = [laptop, { ...laptop, id: 6, name: 'Phone', lastUsedAt: '2026-10-05T10:00:00Z' }];
    const screen = await renderSection();

    await expect.element(screen.getByText('Laptop')).toBeVisible();
    await expect.element(screen.getByText('Phone')).toBeVisible();
    await expect.element(screen.getByText(/never used/)).toBeVisible();
  });

  it('says there are none yet', async () => {
    const screen = await renderSection();
    await expect.element(screen.getByText('You have not added any passkeys yet.')).toBeVisible();
  });

  it('adds a passkey: the options (with the password), the browser prompt, then what it made, with the name', async () => {
    state.api.passkeyRegistrationOptions.mockResolvedValue({ data: { options: { challenge: 'x' }, challenge: 'token' } });
    state.register.mockResolvedValue({ id: 'new-credential' });
    state.api.registerPasskey.mockImplementation(() => {
      state.passkeys = [laptop];
      return Promise.resolve({ data: laptop });
    });
    const screen = await renderSection();

    await screen.getByLabelText('Name').fill('Laptop');
    await screen.getByLabelText('Your current password').fill('hunter2hunter2');
    await screen.getByRole('button', { name: 'Add a passkey' }).click();

    await expect.element(screen.getByText(/never used/)).toBeVisible();
    expect(state.api.passkeyRegistrationOptions).toHaveBeenCalledWith({ currentPassword: 'hunter2hunter2' });
    expect(state.register).toHaveBeenCalledWith({ challenge: 'x' });
    expect(state.api.registerPasskey).toHaveBeenCalledWith({ challenge: 'token', credential: { id: 'new-credential' }, name: 'Laptop' });
  });

  it('shows a wrong password beside the field and adds nothing', async () => {
    state.api.passkeyRegistrationOptions.mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { message: 'bad', errors: { currentPassword: ['The current password is incorrect'] } }, headers: {} },
    });
    const screen = await renderSection();
    await screen.getByLabelText('Your current password').fill('nope');
    await screen.getByRole('button', { name: 'Add a passkey' }).click();

    await expect.element(screen.getByText('The current password is incorrect')).toBeVisible();
    expect(state.register).not.toHaveBeenCalled();
  });

  it('says so when the passkey is on that device already, and stays quiet when the prompt is closed', async () => {
    state.api.passkeyRegistrationOptions.mockResolvedValue({ data: { options: {}, challenge: 'token' } });
    state.register
      .mockRejectedValueOnce({ code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED' })
      .mockRejectedValueOnce({ message: 'closed' });
    const screen = await renderSection();
    await screen.getByLabelText('Your current password').fill('hunter2hunter2');

    await screen.getByRole('button', { name: 'Add a passkey' }).click();
    await expect.element(screen.getByText(/already saved on that device/)).toBeVisible();

    await screen.getByRole('button', { name: 'Add a passkey' }).click();
    await vi.waitFor(() => expect(state.register).toHaveBeenCalledTimes(2));
    await expect.element(screen.getByText(/already saved on that device/)).not.toBeInTheDocument();
    expect(state.api.registerPasskey).not.toHaveBeenCalled();
  });

  it('renames a passkey', async () => {
    state.passkeys = [laptop];
    state.api.renamePasskey.mockImplementation((_id: number, name: string) => {
      state.passkeys = [{ ...laptop, name }];
      return Promise.resolve({ data: state.passkeys[0] });
    });
    const screen = await renderSection();

    await screen.getByRole('button', { name: 'Rename' }).click();
    await screen.getByLabelText('Name').first().fill('Work laptop');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Work laptop')).toBeVisible();
    expect(state.api.renamePasskey).toHaveBeenCalledWith(5, 'Work laptop');
  });

  it('removes a passkey after the password is given', async () => {
    state.passkeys = [laptop];
    state.api.deletePasskey.mockImplementation(() => {
      state.passkeys = [];
      return Promise.resolve({ data: undefined });
    });
    const screen = await renderSection();

    await screen.getByRole('button', { name: 'Remove' }).click();
    await screen.getByLabelText('Your current password').first().fill('hunter2hunter2');
    await screen.getByRole('button', { name: 'Remove' }).last().click();

    await expect.element(screen.getByText('You have not added any passkeys yet.')).toBeVisible();
    expect(state.api.deletePasskey).toHaveBeenCalledWith(5, { currentPassword: 'hunter2hunter2' });
  });

  it('cannot add one in a browser without passkeys, but still lists those that exist', async () => {
    state.supported = false;
    let screen = await renderSection();
    await expect.element(screen.getByText('This browser cannot use passkeys.')).toBeVisible();
    await screen.unmount();

    state.passkeys = [laptop];
    screen = await renderSection();
    await expect.element(screen.getByText('Laptop')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });
});
