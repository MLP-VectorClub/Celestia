import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import { Screen, pngFile, renderPicker } from 'src/components/tools/picker/__tests__/picker-test-utils';
import { SETTINGS_KEY } from 'src/utils/picker/settings';

/** A 100×50 image, left half red and right half blue, with one area on each half (average #800080) */
async function openWithTwoAreas(): Promise<Screen> {
  const screen = await renderPicker();
  await userEvent.upload(screen.getByLabelText('Open images'), await pngFile('wide.png', '#ff0000', '#0000ff', { width: 100, height: 50 }));
  await screen.getByRole('button', { name: '100%' }).click();
  const image = screen.getByRole('img', { name: 'wide.png' });
  const rect = image.element().getBoundingClientRect();
  await image.click({ position: { x: rect.width / 2 - 25, y: rect.height / 2 } });
  await image.click({ position: { x: rect.width / 2 + 25, y: rect.height / 2 } });
  return screen;
}

/** The real clipboard needs a permission the test browser does not grant, so it is replaced for the test */
function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

describe('copying the average color', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    // restore the real property, the mock was defined on the instance
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('copies the color with the # and says so', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    mockClipboard(writeText);
    const screen = await openWithTwoAreas();

    await screen.getByRole('button', { name: 'Copy', exact: true }).click();

    expect(writeText).toHaveBeenCalledExactlyOnceWith('#800080');
    await expect.element(screen.getByText('Copied to the clipboard.')).toBeVisible();
  });

  it('copies the color without the # after switching it off', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    mockClipboard(writeText);
    const screen = await openWithTwoAreas();

    await screen.getByRole('button', { name: '#', exact: true }).click();
    await screen.getByRole('button', { name: 'Copy', exact: true }).click();

    expect(writeText).toHaveBeenCalledExactlyOnceWith('800080');
  });

  it('tells the visitor when the browser refuses clipboard access', async () => {
    mockClipboard(() => Promise.reject(new Error('NotAllowedError')));
    const screen = await openWithTwoAreas();

    await screen.getByRole('button', { name: 'Copy', exact: true }).click();

    await expect.element(screen.getByText('Could not copy, the browser blocked clipboard access.')).toBeVisible();
  });
});

describe('area color', () => {
  beforeEach(() => localStorage.clear());

  it('changes the color of the picking areas of the image', async () => {
    const screen = await openWithTwoAreas();
    const swatch = () => screen.getByRole('button', { name: 'Area color' }).element().querySelector('span') as HTMLElement;
    const before = getComputedStyle(swatch()).backgroundColor;

    await screen.getByRole('button', { name: 'Area color' }).click();
    await userEvent.fill(screen.getByLabelText('Picking area color', { exact: true }), '#00ff00');
    await userEvent.fill(screen.getByLabelText('Opacity (%)'), '100');
    await screen.getByRole('button', { name: 'Set' }).click();

    await expect.poll(() => getComputedStyle(swatch()).backgroundColor).toBe('rgb(0, 255, 0)');
    expect(before).not.toBe('rgb(0, 255, 0)');
  });
});

describe('resizing the area list', () => {
  beforeEach(() => localStorage.clear());

  it('drags the handle to change the share of the width and remembers it', async () => {
    const screen = await openWithTwoAreas();
    const handle = screen.getByRole('separator', { name: 'Resize the picking area list' });
    const parent = handle.element().parentElement as HTMLElement;
    const box = parent.getBoundingClientRect();
    const handleBox = handle.element().getBoundingClientRect();

    // from the handle to 60% of the container's width
    await userEvent.dragAndDrop(handle, parent, {
      sourcePosition: { x: handleBox.width / 2, y: handleBox.height / 2 },
      targetPosition: { x: box.width * 0.6, y: handleBox.top - box.top + handleBox.height / 2 },
    });

    await expect.poll(() => JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').pickerWidth).toBeCloseTo(60, 0);
  });
});
