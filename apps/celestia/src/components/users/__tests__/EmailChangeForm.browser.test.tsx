import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { EmailChangeForm } from 'src/components/users/EmailChangeForm';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

let visitorRole = 'staff';
vi.mock('src/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('src/hooks')>()),
  useAuth: () => ({ user: { id: 1, role: visitorRole } }),
}));

const profile = (account: { email: string | null; emailSet: boolean }) =>
  ({ user: { id: 9 }, account: { ...account, emailVerifiedAt: null, passwordSet: true } }) as never;

const renderForm = (account: { email: string | null; emailSet: boolean }, sameUser: boolean) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlTestProvider>
        <EmailChangeForm profile={profile(account)} sameUser={sameUser} />
      </IntlTestProvider>
    </QueryClientProvider>
  );

describe('EmailChangeForm', () => {
  it('tells staff that the address of another user is hidden, and does not offer it', async () => {
    visitorRole = 'staff';
    const screen = await renderForm({ email: null, emailSet: true }, false);
    await expect.element(screen.getByText('The address is only shown to the user and to developers')).toBeVisible();
    await expect.element(screen.getByText('No address has been set yet')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('heading', { name: 'Change E-mail Address' })).toBeVisible();
  });

  it('still says when another user has no address at all', async () => {
    visitorRole = 'staff';
    const screen = await renderForm({ email: null, emailSet: false }, false);
    await expect.element(screen.getByText('No address has been set yet')).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: 'Set E-mail Address' })).toBeVisible();
  });

  it('shows developers the address of another user', async () => {
    visitorRole = 'developer';
    const screen = await renderForm({ email: 'them@example.com', emailSet: true }, false);
    await expect.element(screen.getByLabelText('Current E-mail Address')).toHaveValue('them@example.com');
  });

  it('shows users their own address', async () => {
    visitorRole = 'staff';
    const screen = await renderForm({ email: 'me@example.com', emailSet: true }, true);
    await expect.element(screen.getByLabelText('Current E-mail Address')).toHaveValue('me@example.com');
  });
});
