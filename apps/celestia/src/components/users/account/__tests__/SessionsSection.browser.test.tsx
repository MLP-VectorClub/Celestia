import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SessionsSection } from 'src/components/users/account/SessionsSection';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({ signedIn: true, getSessions: vi.fn() }));

vi.mock('src/hooks', () => ({
  useAuth: () => ({ signedIn: state.signedIn }),
  useApiMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  describeApiError: () => 'Could not load',
}));
vi.mock('src/services/account', () => ({
  AccountService: { getSessions: () => state.getSessions(), getSessionsOf: () => state.getSessions() },
}));
vi.mock('src/store', () => ({ useAppDispatch: () => vi.fn() }));
vi.mock('src/store/thunks', () => ({ signOutThunk: () => ({ type: 'signOut' }) }));
vi.mock('src/utils', () => ({ ENDPOINTS: { USERS_ME: '/users/me' } }));
vi.mock('src/utils/common', () => ({ httpResponseMapper: (e: unknown) => e }));
vi.mock('src/components/shared/dialogs/DialogProvider', () => ({ useDialog: () => ({ confirm: vi.fn() }) }));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));
vi.mock('src/components/shared/TimeAgo', () => ({ default: () => <span>a while ago</span> }));

const renderSection = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <IntlTestProvider>
        <SessionsSection userId={1} own />
      </IntlTestProvider>
    </QueryClientProvider>
  );

describe('SessionsSection', () => {
  beforeEach(() => {
    state.signedIn = true;
    state.getSessions.mockReset();
  });

  it('says it is loading until the list has arrived, not that nobody is signed in', async () => {
    state.getSessions.mockReturnValue(new Promise(() => undefined));
    const screen = await renderSection();
    await expect.element(screen.getByText('Loading…')).toBeVisible();
    await expect.element(screen.getByText(/aren't logged in anywhere/)).not.toBeInTheDocument();
  });

  it('says so when the list is empty', async () => {
    state.getSessions.mockResolvedValue({ data: { sessions: [] } });
    const screen = await renderSection();
    await expect.element(screen.getByText(/aren't logged in anywhere/)).toBeVisible();
  });

  it('shows what went wrong, and not "nobody is signed in", when the list could not be fetched, with a way to ask again', async () => {
    state.getSessions.mockRejectedValueOnce({ message: 'nope' }).mockResolvedValue({ data: { sessions: [] } });
    const screen = await renderSection();
    await expect.element(screen.getByText(/Could not load/)).toBeVisible();
    await expect.element(screen.getByText(/aren't logged in anywhere/)).not.toBeInTheDocument();

    await screen.getByRole('button', { name: 'Try again' }).click();
    await expect.element(screen.getByText(/aren't logged in anywhere/)).toBeVisible();
  });

  it('does not ask for the list before the visitor is signed in', async () => {
    state.signedIn = false;
    state.getSessions.mockResolvedValue({ data: { sessions: [] } });
    const screen = await renderSection();
    await expect.element(screen.getByText('Loading…')).toBeVisible();
    expect(state.getSessions).not.toHaveBeenCalled();
  });
});
