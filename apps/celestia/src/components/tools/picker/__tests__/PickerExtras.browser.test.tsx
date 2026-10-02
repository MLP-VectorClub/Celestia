import { beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { Screen, pngFile, renderPicker, statusText } from 'src/components/tools/picker/__tests__/picker-test-utils';

beforeEach(() => localStorage.clear());

async function openGray(): Promise<Screen> {
  const screen = await renderPicker();
  // #646464 is 100/255 in every channel
  await userEvent.upload(screen.getByLabelText('Open images'), await pngFile('gray.png', '#646464', '#646464', { width: 100, height: 50 }));
  await screen.getByRole('button', { name: '100%' }).click();
  return screen;
}

/** The color the stage canvas shows at the middle of the view */
function shownCenterColor(screen: Screen): number[] {
  const canvas = screen.getByRole('img', { name: 'gray.png' }).element().querySelector('canvas')!;
  return Array.from(canvas.getContext('2d')!.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data);
}

describe('hints', () => {
  it('explains a control in the status bar while it is hovered', async () => {
    const screen = await openGray();
    await userEvent.hover(screen.getByRole('button', { name: 'Fit' }));
    await expect.poll(() => statusText(screen)).toMatch(/Fit in view \(Ctrl\+0\)/);
    await userEvent.hover(screen.getByRole('button', { name: 'Hand' }));
    await expect.poll(() => statusText(screen)).toMatch(/Hand tool \(H\)/);
  });
});

describe('about', () => {
  it('opens from the menu and closes again', async () => {
    const screen = await renderPicker();
    await screen.getByRole('button', { name: 'About' }).click();
    await expect.element(screen.getByText(/accurate color readings from screencaps/)).toBeVisible();
    await screen.getByRole('button', { name: 'Close', exact: true }).first().click();
    await expect.element(screen.getByText(/accurate color readings from screencaps/)).not.toBeInTheDocument();
  });
});

describe('levels', () => {
  it('is only available with an image open', async () => {
    const screen = await renderPicker();
    await expect.element(screen.getByRole('button', { name: 'Levels' })).toBeDisabled();
  });

  it('changes how the image looks but not the color that is read from it', async () => {
    const screen = await openGray();
    await expect.poll(() => shownCenterColor(screen).slice(0, 3)).toEqual([100, 100, 100]);

    await screen.getByRole('button', { name: 'Levels' }).click();
    await userEvent.fill(screen.getByLabelText('Low value'), '50');
    await userEvent.fill(screen.getByLabelText('High value'), '150');
    await screen.getByRole('button', { name: 'Set' }).click();
    await expect.element(screen.getByRole('button', { name: 'Levels' })).toHaveAttribute('aria-pressed', 'true');

    // (100 - 50) / (150 - 50) * 255 = 127.5
    await expect.poll(() => shownCenterColor(screen)[0]).toBeGreaterThanOrEqual(127);
    expect(shownCenterColor(screen)[0]).toBeLessThanOrEqual(128);

    const stage = screen.getByRole('img', { name: 'gray.png' });
    const rect = stage.element().getBoundingClientRect();
    await userEvent.hover(stage, { position: { x: rect.width / 2, y: rect.height / 2 } });
    await expect.poll(() => statusText(screen)).toMatch(/#646464 100%/);
  });

  it('keeps picking area averages on the original pixels', async () => {
    const screen = await openGray();
    await screen.getByRole('button', { name: 'Levels' }).click();
    await userEvent.fill(screen.getByLabelText('Low value'), '50');
    await userEvent.fill(screen.getByLabelText('High value'), '150');
    await screen.getByRole('button', { name: 'Set' }).click();

    const stage = screen.getByRole('img', { name: 'gray.png' });
    const rect = stage.element().getBoundingClientRect();
    await stage.click({ position: { x: rect.width / 2, y: rect.height / 2 } });
    await expect.element(screen.getByRole('button', { name: /#646464.*25px/ })).toBeVisible();
  });

  it('can be reset to the full range', async () => {
    const screen = await openGray();
    await screen.getByRole('button', { name: 'Levels' }).click();
    await userEvent.fill(screen.getByLabelText('Low value'), '50');
    await screen.getByRole('button', { name: 'Set' }).click();
    await expect.element(screen.getByRole('button', { name: 'Levels' })).toHaveAttribute('aria-pressed', 'true');

    await screen.getByRole('button', { name: 'Levels' }).click();
    await screen.getByRole('button', { name: 'Reset to defaults' }).click();
    await screen.getByRole('button', { name: 'Set' }).click();
    await expect.element(screen.getByRole('button', { name: 'Levels' })).toHaveAttribute('aria-pressed', 'false');
  });
});
