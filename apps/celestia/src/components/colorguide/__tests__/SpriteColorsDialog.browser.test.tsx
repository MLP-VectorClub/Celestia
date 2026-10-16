import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SpriteColorsDialog } from 'src/components/colorguide/SpriteColorsDialog';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';
import { SpriteColorCheck } from 'src/types/sprite-colors';

const state = vi.hoisted(() => ({ getSpriteColors: vi.fn() }));

vi.mock('src/services/color-guide', () => ({
  ColorGuideService: class {
    getSpriteColors = state.getSpriteColors;
  },
}));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));

const result: SpriteColorCheck = {
  palette: [
    { group: 'Coat', label: 'Fill', hex: '#FF0000', status: 'present', optional: false, pixels: 50 },
    { group: 'Mane', label: 'Outline', hex: '#0000FF', status: 'missing', optional: false, pixels: 0 },
    { group: 'Mane', label: 'Fill (Younger)', hex: '#00FF00', status: 'missing', optional: true, pixels: 0 },
  ],
  colors: [
    {
      hex: '#FF0000',
      pixels: 50,
      translucentPixels: 0,
      kind: 'listed',
      labels: ['Coat | Fill'],
      nearest: null,
      blendOf: null,
      blendMode: null,
    },
    {
      hex: '#FE0000',
      pixels: 9,
      translucentPixels: 0,
      kind: 'near',
      labels: [],
      nearest: { hex: '#FF0000', label: 'Coat | Fill', distance: 1 },
      blendOf: null,
      blendMode: null,
    },
    {
      hex: '#800080',
      pixels: 7,
      translucentPixels: 0,
      kind: 'blend',
      labels: [],
      nearest: null,
      blendOf: ['#FF0000', '#0000FF'],
      blendMode: 'mix',
    },
  ],
  summary: { missing: 1, translucentOnly: 0, near: 1, unknown: 0, specks: 0, ok: false },
};

const renderDialog = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <IntlTestProvider>
        <SpriteColorsDialog appearanceId={7} isOpen onClose={() => undefined} />
      </IntlTestProvider>
    </QueryClientProvider>
  );

describe('SpriteColorsDialog', () => {
  beforeEach(() => state.getSpriteColors.mockReset());

  it('lists the colors of the sprite, how they relate to the listed ones, and what is not used', async () => {
    state.getSpriteColors.mockResolvedValue({ data: result });
    const screen = await renderDialog();

    await expect.element(screen.getByText('2 things to look at')).toBeVisible();
    await expect.element(screen.getByText('Coat | Fill', { exact: true }).first()).toBeVisible();
    await expect.element(screen.getByText(/Looks like Coat \| Fill \(#FF0000\)/)).toBeVisible();
    await expect.element(screen.getByText('Mix of #FF0000 and #0000FF')).toBeVisible();
    await expect.element(screen.getByText('Not used', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Not used (optional)')).toBeVisible();
    expect(state.getSpriteColors).toHaveBeenCalledWith({ id: 7, token: undefined });
  });

  it('says when everything is fine', async () => {
    state.getSpriteColors.mockResolvedValue({ data: { ...result, summary: { ...result.summary, ok: true } } });
    const screen = await renderDialog();

    await expect.element(screen.getByText(/Every listed color is used/)).toBeVisible();
  });

  it('shows the error and tries again', async () => {
    state.getSpriteColors.mockRejectedValueOnce(new Error('nope')).mockResolvedValue({ data: result });
    const screen = await renderDialog();

    await screen.getByRole('button', { name: 'Try again' }).click();

    await expect.element(screen.getByTestId('sprite-colors-summary')).toBeVisible();
  });
});
