import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { AppearanceColorGroups } from 'src/components/colorguide/AppearanceColorGroups';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

vi.mock('src/hooks', () => ({
  useAuth: () => ({ signedIn: false }),
  usePrefs: () => ({ cg_hideclrinfo: false }),
  useApiMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  describeApiError: () => '',
}));
vi.mock('src/components/colorguide/ColorGroupDialog', () => ({ ColorGroupDialog: () => null }));
vi.mock('src/components/colorguide/ColorGroupOrderDialog', () => ({ ColorGroupOrderDialog: () => null }));
vi.mock('src/components/shared/dialogs/DialogProvider', () => ({ useDialog: () => ({ confirm: vi.fn() }) }));
vi.mock('src/components/colorguide/ColorListItem', () => ({
  ColorListItem: ({ color }: { color: { label: string } }) => <li>{color.label} #336699 • rgb(51, 102, 153)</li>,
}));

const groups = ['Coat', 'Mane', 'Eyes', 'Iris', 'Cutie Mark', 'Magic'].map((label, i) => ({
  id: i + 1,
  label,
  order: i + 1,
  colors: [{ id: i * 10 + 1, label: 'Fill', order: 1, hex: '#336699' }],
}));

const renderGroups = (width: number) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlTestProvider>
        <div style={{ width }}>
          <AppearanceColorGroups colorGroups={groups as never} />
        </div>
      </IntlTestProvider>
    </QueryClientProvider>
  );

const cards = (screen: Awaited<ReturnType<typeof renderGroups>>) =>
  Array.from(screen.container.querySelectorAll<HTMLElement>('[role="region"]')).map((el) => el.getBoundingClientRect());

describe('AppearanceColorGroups layout', () => {
  it('puts the cards side by side when there is room', async () => {
    const rects = cards(await renderGroups(1800));

    expect(rects).toHaveLength(6);
    expect(new Set(rects.map((r) => Math.round(r.top))).size).toBe(1);
  });

  it('wraps the cards onto more lines instead of squeezing them on narrower screens', async () => {
    const rects = cards(await renderGroups(900));

    expect(new Set(rects.map((r) => Math.round(r.top))).size).toBeGreaterThan(1);
    rects.forEach((r) => expect(r.width).toBeGreaterThanOrEqual(16 * 17 - 1));
  });

  it('stacks them on a phone', async () => {
    const rects = cards(await renderGroups(360));

    expect(new Set(rects.map((r) => Math.round(r.left))).size).toBe(1);
  });
});
