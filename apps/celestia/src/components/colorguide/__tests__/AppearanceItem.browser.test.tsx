import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import AppearanceItem from 'src/components/colorguide/AppearanceItem';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const auth = vi.hoisted(() => ({ isStaff: false, user: { id: null as number | null } }));

vi.mock('src/hooks', () => ({
  useAuth: () => auth,
  useApiMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  describeApiError: () => '',
}));
vi.mock('src/components/shared/dialogs/DialogProvider', () => ({ useDialog: () => ({ confirm: vi.fn() }) }));
// What the entry holds besides the sprite is not what is tested here
vi.mock('src/components/colorguide/SpriteWrap', () => ({ SpriteWrap: () => <div data-testid="sprite-wrap" /> }));
vi.mock('src/components/colorguide/AppearanceItemColorGroups', () => ({ default: () => null }));
vi.mock('src/components/colorguide/AppearanceItemNotes', () => ({ default: () => null }));
vi.mock('src/components/colorguide/AppearanceItemTags', () => ({ default: () => null }));
vi.mock('src/components/colorguide/AppearanceMetaDialog', () => ({ AppearanceMetaDialog: () => null }));
vi.mock('src/components/colorguide/SwatchDialog', () => ({ SwatchDialog: () => null }));
vi.mock('src/components/colorguide/NutshellLabel', () => ({ NutshellLabel: () => <>Twilight</> }));

const renderItem = (sprite: unknown) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlTestProvider>
        <AppearanceItem appearance={{ id: 5, label: 'Twilight', ownerId: null, sprite, colorGroups: [], tags: [] } as never} />
      </IntlTestProvider>
    </QueryClientProvider>
  );

describe('AppearanceItem sprite box', () => {
  beforeEach(() => {
    auth.isStaff = false;
    auth.user = { id: null };
  });

  it('shows the sprite to everybody', async () => {
    const screen = await renderItem({ hash: 'abc' });
    await expect.element(screen.getByTestId('sprite-wrap')).toBeInTheDocument();
  });

  it('keeps no box (or space) for a missing sprite when the visitor cannot add one', async () => {
    const screen = await renderItem(null);
    await expect.element(screen.getByTestId('sprite-wrap')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Twilight')).toBeVisible();
  });

  it('keeps the box for a missing sprite for those who can add one', async () => {
    auth.isStaff = true;
    const screen = await renderItem(null);
    await expect.element(screen.getByTestId('sprite-wrap')).toBeInTheDocument();
  });

  it('outlines the sprite box only for those who can drop a file on it', async () => {
    const box = async () =>
      getComputedStyle((await renderItem({ hash: 'abc' })).getByTestId('sprite-wrap').element().parentElement!).borderTopStyle;

    expect(await box()).toBe('none');
  });

  it('outlines the box of those who can add a sprite', async () => {
    auth.isStaff = true;
    const screen = await renderItem({ hash: 'abc' });

    expect(getComputedStyle(screen.getByTestId('sprite-wrap').element().parentElement!).borderTopStyle).toBe('dashed');
  });
});
