import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ApiKeysSection } from 'src/components/users/account/ApiKeysSection';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({
  keys: [] as {
    id: number;
    name: string;
    scopes: string[];
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
  }[],
  status: { enabled: false, recoveryCodesRemaining: 0, passwordSet: true },
  api: {
    getApiKeys: vi.fn(),
    getTwoFactor: vi.fn(),
    createApiKey: vi.fn(),
    rotateApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
  },
}));

vi.mock('src/hooks', async () => ({
  ...(await vi.importActual<object>('src/hooks/mutation')),
  useAuth: () => ({ signedIn: true }),
}));
vi.mock('src/services/account', () => ({ AccountService: state.api }));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));
vi.mock('src/components/shared/TimeAgo', () => ({ default: () => <span>a while ago</span> }));
vi.mock('src/components/shared/dialogs/DialogProvider', () => ({ useDialog: () => ({ confirm: () => Promise.resolve(true) }) }));

const renderSection = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <IntlTestProvider>
        <ApiKeysSection />
      </IntlTestProvider>
    </QueryClientProvider>
  );

const ci = { id: 3, name: 'CI', scopes: ['read'], createdAt: '2026-10-01T10:00:00Z', lastUsedAt: null, expiresAt: null };

describe('ApiKeysSection', () => {
  beforeEach(() => {
    Object.values(state.api).forEach((fn) => fn.mockReset());
    state.keys = [];
    state.status = { enabled: false, recoveryCodesRemaining: 0, passwordSet: true };
    state.api.getApiKeys.mockImplementation(() => Promise.resolve({ data: state.keys }));
    state.api.getTwoFactor.mockImplementation(() => Promise.resolve({ data: state.status }));
  });

  it('lists keys with their scopes and never shows a secret', async () => {
    state.keys = [ci];
    const screen = await renderSection();

    await expect.element(screen.getByText('CI')).toBeVisible();
    await expect.element(screen.getByText('Read public data', { exact: true }).first()).toBeVisible();
    await expect.element(screen.getByText(/never used/)).toBeVisible();
  });

  it('says there are none yet', async () => {
    const screen = await renderSection();
    await expect.element(screen.getByText('You have not created any API keys yet.')).toBeVisible();
  });

  it('creates a key with the password and shows its secret once', async () => {
    state.api.createApiKey.mockImplementation(() => {
      state.keys = [ci];
      return Promise.resolve({ data: { key: ci, secret: 'vck_9|secretvalue' } });
    });
    const screen = await renderSection();

    await screen.getByLabelText('Name').fill('CI');
    await screen.getByLabelText('Your current password').fill('hunter2hunter2');
    await screen.getByRole('button', { name: 'Create key' }).click();

    await expect.element(screen.getByText('vck_9|secretvalue')).toBeVisible();
    expect(state.api.createApiKey).toHaveBeenCalledWith({
      name: 'CI',
      scopes: ['read'],
      expiresInDays: 90,
      currentPassword: 'hunter2hunter2',
    });

    await screen.getByRole('button', { name: 'I have saved it' }).click();
    await expect.element(screen.getByText('vck_9|secretvalue')).not.toBeInTheDocument();
  });

  it('shows a wrong password beside the field', async () => {
    state.api.createApiKey.mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { message: 'bad', errors: { currentPassword: ['The current password is incorrect'] } }, headers: {} },
    });
    const screen = await renderSection();
    await screen.getByLabelText('Name').fill('CI');
    await screen.getByLabelText('Your current password').fill('nope');
    await screen.getByRole('button', { name: 'Create key' }).click();

    await expect.element(screen.getByText('The current password is incorrect')).toBeVisible();
  });

  it('rotates a key after the password is given', async () => {
    state.keys = [ci];
    state.api.rotateApiKey.mockResolvedValue({ data: { key: ci, secret: 'vck_10|newsecret' } });
    const screen = await renderSection();

    await screen.getByRole('button', { name: 'Rotate' }).first().click();
    await screen.getByLabelText('Your current password').first().fill('hunter2hunter2');
    await screen.getByRole('button', { name: 'Rotate' }).last().click();

    await expect.element(screen.getByText('vck_10|newsecret')).toBeVisible();
    expect(state.api.rotateApiKey).toHaveBeenCalledWith(3, { currentPassword: 'hunter2hunter2' });
  });

  it('revokes a key after confirming', async () => {
    state.keys = [ci];
    state.api.deleteApiKey.mockImplementation(() => {
      state.keys = [];
      return Promise.resolve({ data: undefined });
    });
    const screen = await renderSection();

    await screen.getByRole('button', { name: 'Revoke' }).click();

    await expect.element(screen.getByText('You have not created any API keys yet.')).toBeVisible();
    expect(state.api.deleteApiKey).toHaveBeenCalledWith(3);
  });
});
