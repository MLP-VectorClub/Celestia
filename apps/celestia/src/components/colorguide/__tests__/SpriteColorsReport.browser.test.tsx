import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SpriteColorsReport } from 'src/components/colorguide/SpriteColorsReport';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';
import { SpriteColorCheck, SpriteColorEntry } from 'src/types/sprite-colors';

const state = vi.hoisted(() => ({ getSpriteColors: vi.fn(), getSpriteSvg: vi.fn() }));

vi.mock('src/services/color-guide', () => ({
  ColorGuideService: class {
    getSpriteColors = state.getSpriteColors;
    getSpriteSvg = state.getSpriteSvg;
  },
}));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));

const entry = (extra: Partial<SpriteColorEntry> & Pick<SpriteColorEntry, 'hex' | 'kind'>): SpriteColorEntry => ({
  pixels: 5,
  translucentPixels: 0,
  labels: [],
  nearest: null,
  blendOf: null,
  blendMode: null,
  blendOpacity: null,
  ...extra,
});

const result: SpriteColorCheck = {
  palette: [
    { group: 'Coat', label: 'Fill', hex: '#FF0000', opacity: null, blendMode: null, status: 'present', optional: false, pixels: 50 },
    { group: 'Mane', label: 'Outline', hex: '#0000FF', opacity: null, blendMode: null, status: 'missing', optional: false, pixels: 0 },
    {
      group: 'Mane',
      label: 'Fill (Younger)',
      hex: '#00FF00',
      opacity: null,
      blendMode: null,
      status: 'missing',
      optional: true,
      pixels: 0,
    },
    { group: 'Glasses', label: 'Lens', hex: '#112233', opacity: 40, blendMode: 'overlay', status: 'present', optional: false, pixels: 3 },
  ],
  colors: [
    entry({ hex: '#FF0000', pixels: 50, kind: 'listed', labels: ['Coat | Fill'] }),
    entry({ hex: '#00FF00', pixels: 4, kind: 'listed', labels: ['Eyes | Iris', 'Mane | Fill (Younger)'] }),
    entry({ hex: '#FE0000', pixels: 9, kind: 'near', nearest: { hex: '#FF0000', label: 'Coat | Fill', distance: 1 } }),
    entry({ hex: '#800080', pixels: 7, kind: 'blend', blendOf: ['#FF0000', '#0000FF'], blendMode: 'mix' }),
    entry({ hex: '#445566', pixels: 6, kind: 'blend', blendOf: ['#112233', '#FF0000'], blendMode: 'overlay', blendOpacity: 40 }),
  ],
  summary: { missing: 1, translucentOnly: 0, near: 1, unknown: 0, specks: 0, ok: false },
};

const renderReport = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <IntlTestProvider>
        <SpriteColorsReport appearanceId={7} label="Pony" />
      </IntlTestProvider>
    </QueryClientProvider>
  );

describe('SpriteColorsReport', () => {
  beforeEach(() => {
    state.getSpriteColors.mockReset();
    state.getSpriteSvg.mockReset();
    state.getSpriteSvg.mockResolvedValue({
      data: "<svg viewBox='0 0 2 1'><path fill='#FF0000' d='M0 0h1v1h-1z'/><path fill='#0000FF' d='M1 0h1v1h-1z'/></svg>",
    });
  });

  it('lists the colors of the sprite, how they relate to the listed ones, and what is not used', async () => {
    state.getSpriteColors.mockResolvedValue({ data: result });
    const screen = await renderReport();

    await expect.element(screen.getByText('2 things to look at')).toBeVisible();
    await expect.element(screen.getByText('Coat | Fill', { exact: true }).first()).toBeVisible();
    await expect.element(screen.getByText(/Looks like Coat \| Fill \(#FF0000\)/)).toBeVisible();
    await expect.element(screen.getByText('Mix of #FF0000 and #0000FF')).toBeVisible();
    await expect.element(screen.getByText('#112233 at 40% over #FF0000 (Overlay)')).toBeVisible();
    await expect.element(screen.getByText('Not used', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Not used (optional)')).toBeVisible();
    expect(state.getSpriteColors).toHaveBeenCalledWith({ id: 7, token: undefined });
  });

  it('names every listed color that shares a value on a line of its own', async () => {
    state.getSpriteColors.mockResolvedValue({ data: result });
    const screen = await renderReport();
    await expect.element(screen.getByText('Eyes | Iris')).toBeVisible();

    const lines = Array.from(screen.container.querySelectorAll('tr[data-hex="#00FF00"] .listed-label'));
    expect(lines.map((l) => l.textContent)).toEqual(['Eyes | Iris', 'Mane | Fill (Younger)']);
    expect(lines[1].getBoundingClientRect().top).toBeGreaterThan(lines[0].getBoundingClientRect().top);
  });

  it('draws the sprite on the transparency grid', async () => {
    state.getSpriteColors.mockResolvedValue({ data: result });
    const screen = await renderReport();
    await expect.element(screen.getByRole('img', { name: 'Sprite of Pony' })).toBeVisible();

    const style = getComputedStyle(screen.getByRole('img', { name: 'Sprite of Pony' }).element());
    expect(style.backgroundImage).toContain('/img/transparency.svg');
  });

  it('dims the rest of the sprite while a color is pointed at', async () => {
    state.getSpriteColors.mockResolvedValue({ data: result });
    const screen = await renderReport();
    await expect.element(screen.getByText('2 things to look at')).toBeVisible();

    expect(document.body.innerHTML).not.toContain('path:not([fill');
    await screen.getByText('#FF0000', { exact: true }).first().hover();

    await vi.waitFor(() => expect(document.body.innerHTML).toContain("path:not([fill='#FF0000'])"));
  });

  it('says when everything is fine', async () => {
    state.getSpriteColors.mockResolvedValue({ data: { ...result, summary: { ...result.summary, ok: true } } });
    const screen = await renderReport();

    await expect.element(screen.getByText(/Every listed color is used/)).toBeVisible();
  });

  it('shows the error and tries again', async () => {
    state.getSpriteColors.mockRejectedValueOnce(new Error('nope')).mockResolvedValue({ data: result });
    const screen = await renderReport();

    await screen.getByRole('button', { name: 'Try again' }).click();

    await expect.element(screen.getByText('2 things to look at')).toBeVisible();
  });
});
