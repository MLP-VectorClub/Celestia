import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ColorListItem } from 'src/components/colorguide/ColorListItem';
import ColorSquare from 'src/components/colorguide/ColorSquare';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

vi.mock('src/hooks/color-copy', () => ({ useColorCopySettings: () => ({ copyHash: true, rgbOnClick: false }) }));

const opaque = { id: 1, label: 'Fill', order: 1, hex: '#336699' };
const glass = { id: 2, label: 'Lens', order: 2, hex: '#336699', opacity: 40, blendMode: 'overlay' as const };

describe('ColorSquare', () => {
  it('is a plain fill for an opaque color', async () => {
    const screen = await render(
      <IntlTestProvider>
        <ColorSquare color={opaque} />
      </IntlTestProvider>
    );

    const square = screen.getByRole('button').element() as HTMLElement;
    expect(getComputedStyle(square).backgroundColor).toBe('rgb(51, 102, 153)');
    expect(getComputedStyle(square).backgroundImage).toBe('none');
  });

  it('is split along the diagonal for a semi-transparent one: the color itself above, its opacity and blend mode over the grid below', async () => {
    const screen = await render(
      <IntlTestProvider>
        <ColorSquare color={glass} />
      </IntlTestProvider>
    );

    const style = getComputedStyle(screen.getByRole('button').element() as HTMLElement);
    expect(style.backgroundImage).toMatch(
      /^linear-gradient\(to right bottom, rgb\(51, 102, 153\) 0px, rgb\(51, 102, 153\) 50%, rgba\(0, 0, 0, 0\) 50%/
    );
    expect(style.backgroundImage).toContain('rgba(51, 102, 153, 0.4)');
    expect(style.backgroundImage).toContain('/img/transparency.svg');
    expect(style.backgroundBlendMode).toBe('normal, overlay, normal');
  });
});

describe('ColorListItem', () => {
  it('writes rgb() for opaque colors and rgba() for semi-transparent ones', async () => {
    const screen = await render(
      <IntlTestProvider>
        <ul>
          <ColorListItem color={opaque} />
          <ColorListItem color={glass} />
        </ul>
      </IntlTestProvider>
    );

    await expect.element(screen.getByText('#336699 • rgb(51, 102, 153)')).toBeVisible();
    await expect.element(screen.getByText('#336699 • rgba(51, 102, 153, 0.4)')).toBeVisible();
  });
});
