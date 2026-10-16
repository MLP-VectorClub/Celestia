import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { DiscordSection } from 'src/components/users/account/DiscordSection';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';
import { ENDPOINTS } from 'src/utils';

const api = vi.hoisted(() => ({ syncDiscord: vi.fn(), unlinkDiscord: vi.fn() }));

vi.mock('src/hooks', async () => ({
  ...(await vi.importActual<object>('src/hooks/mutation')),
  useConfig: () => ({ config: { discordInviteLink: 'https://discord.example/invite' } }),
}));
vi.mock('src/services/account', () => ({ AccountService: api }));
vi.mock('src/components/shared/dialogs/DialogProvider', () => ({ useDialog: () => ({ confirm: vi.fn().mockResolvedValue(true) }) }));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));
vi.mock('src/components/shared/TimeAgo', () => ({ default: () => <span>a while ago</span> }));

const profile = {
  user: { id: 5 },
  discord: { linked: true, tag: 'Pony#0', serverMember: false, canSync: true, lastSynced: '2026-10-01T00:00:00Z', syncCooldown: 300 },
} as never;

const setup = async (sameUser: boolean) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData([ENDPOINTS.USERS_ME], { id: 5, discordServerMember: false });
  queryClient.setQueryData([ENDPOINTS.USER_PROFILE({ id: 5 })], {});
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <IntlTestProvider>
        <DiscordSection profile={profile} sameUser={sameUser} />
      </IntlTestProvider>
    </QueryClientProvider>
  );
  await screen.getByRole('button', { name: 'Sync' }).click();
  await vi.waitFor(() => expect(api.syncDiscord).toHaveBeenCalled());
  return queryClient;
};

describe('DiscordSection sync', () => {
  beforeEach(() => {
    api.syncDiscord.mockReset().mockResolvedValue({ data: {} });
  });

  it('refreshes the signed in user too, since the sidebar decides about its Discord invitation by it', async () => {
    const queryClient = await setup(true);

    await vi.waitFor(() => {
      expect(queryClient.getQueryState([ENDPOINTS.USERS_ME])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState([ENDPOINTS.USER_PROFILE({ id: 5 })])?.isInvalidated).toBe(true);
    });
  });

  it('leaves the signed in user alone when staff sync somebody else', async () => {
    const queryClient = await setup(false);

    await vi.waitFor(() => expect(queryClient.getQueryState([ENDPOINTS.USER_PROFILE({ id: 5 })])?.isInvalidated).toBe(true));
    expect(queryClient.getQueryState([ENDPOINTS.USERS_ME])?.isInvalidated).toBe(false);
  });
});
