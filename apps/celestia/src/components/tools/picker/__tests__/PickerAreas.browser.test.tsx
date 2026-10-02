import { beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { Screen, pngFile, renderPicker } from 'src/components/tools/picker/__tests__/picker-test-utils';

/** A 100×50 image, left half red and right half blue, shown at 100% so the picture is centered in the stage */
async function openWide(): Promise<{ screen: Screen; at: (dx: number, dy?: number) => { position: { x: number; y: number } } }> {
  const screen = await renderPicker();
  await userEvent.upload(screen.getByLabelText('Open images'), await pngFile('wide.png', '#ff0000', '#0000ff', { width: 100, height: 50 }));
  await screen.getByRole('button', { name: '100%' }).click();
  const rect = screen.getByRole('img', { name: 'wide.png' }).element().getBoundingClientRect();
  // positions are relative to the image's center, in image pixels
  return { screen, at: (dx, dy = 0) => ({ position: { x: rect.width / 2 + dx, y: rect.height / 2 + dy } }) };
}

const stageOf = (screen: Screen) => screen.getByRole('img', { name: 'wide.png' });
const totals = (screen: Screen, text: string) => expect.element(screen.getByText(text)).toBeVisible();

describe('picking areas', () => {
  // settings persist in localStorage, every test starts from the defaults
  beforeEach(() => localStorage.clear());

  it('places a square area at the click and lists its average color', async () => {
    const { screen, at } = await openWide();
    await stageOf(screen).click(at(-25));
    await totals(screen, '1 area & 1 image');
    await expect.element(screen.getByRole('button', { name: /#ff0000.*25px/ })).toBeVisible();
  });

  it('averages an area that covers both colors', async () => {
    const { screen, at } = await openWide();
    await stageOf(screen).click(at(0));
    // 12 or 13 red columns out of 25, depending on which side of the pixel boundary the click rounded to
    await expect.element(screen.getByRole('button', { name: /#(7a0085|85007a).*25px/ })).toBeVisible();
  });

  it('ignores the part of an area that lies outside the image', async () => {
    const { screen, at } = await openWide();
    await stageOf(screen).click(at(-49, -24));
    await expect.element(screen.getByRole('button', { name: /#ff0000.*25px/ })).toBeVisible();
  });

  it('places a round area with Alt+click', async () => {
    const { screen, at } = await openWide();
    await stageOf(screen).click({ ...at(-25), modifiers: ['Alt'] });
    await expect.element(screen.getByRole('button', { name: /#ff0000.*●.*25px/ })).toBeVisible();
  });

  it('uses the size typed into the size field for the next areas', async () => {
    const { screen, at } = await openWide();
    await userEvent.fill(screen.getByLabelText('Picking area size', { exact: true }), '10');
    await userEvent.keyboard('{Enter}');
    await stageOf(screen).click(at(-25));
    await expect.element(screen.getByRole('button', { name: /#ff0000.*10px/ })).toBeVisible();
  });

  it('changes the size with the arrow keys', async () => {
    const { screen, at } = await openWide();
    await userEvent.keyboard('{ArrowDown}');
    await stageOf(screen).click(at(-25));
    await expect.element(screen.getByRole('button', { name: /#ff0000.*20px/ })).toBeVisible();
  });

  it('shows the overall average of all areas and can toggle the # when copying', async () => {
    const { screen, at } = await openWide();
    await stageOf(screen).click(at(-25));
    await stageOf(screen).click(at(25));
    await totals(screen, '2 areas & 1 image');
    await expect.element(screen.getByText('#800080')).toBeVisible();
    await expect.element(screen.getByText('rgb(128, 0, 128)')).toBeVisible();

    const toggle = screen.getByRole('button', { name: '#', exact: true });
    await toggle.click();
    await expect.element(screen.getByRole('button', { name: 'no #' })).toBeVisible();
  });

  it('deletes the selected areas with the Delete key and selects all with Ctrl+A', async () => {
    const { screen, at } = await openWide();
    await stageOf(screen).click(at(-25));
    await stageOf(screen).click(at(25));
    await userEvent.keyboard('{Delete}');
    await totals(screen, '1 area & 1 image');
    await userEvent.keyboard('{Control>}a{/Control}');
    await userEvent.keyboard('{Delete}');
    await totals(screen, '0 areas & 0 images');
  });

  it('selects from the list and deletes with the button', async () => {
    const { screen, at } = await openWide();
    await stageOf(screen).click(at(-25));
    await stageOf(screen).click(at(25));
    await userEvent.keyboard('{Control>}{Shift>}a{/Shift}{/Control}');
    await expect.element(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    await screen.getByRole('button', { name: /#0000ff/ }).click();
    await screen.getByRole('button', { name: 'Delete' }).click();
    await totals(screen, '1 area & 1 image');
    await expect.element(screen.getByRole('button', { name: /#0000ff.*25px/ })).not.toBeInTheDocument();
  });

  it('edits the shape and size of an area with a double click', async () => {
    const { screen, at } = await openWide();
    await stageOf(screen).click(at(-25));
    await screen.getByRole('button', { name: /#ff0000.*25px/ }).dblClick();
    await userEvent.selectOptions(screen.getByLabelText('Shape'), 'round');
    await userEvent.fill(screen.getByLabelText(/^Size/), '11');
    await screen.getByRole('button', { name: 'Apply' }).click();
    await expect.element(screen.getByRole('button', { name: /#ff0000.*●.*11px/ })).toBeVisible();
  });

  it('keeps the areas of each image separate and asks before closing an image that has areas', async () => {
    const { screen, at } = await openWide();
    await stageOf(screen).click(at(-25));
    await userEvent.upload(screen.getByLabelText('Open images'), await pngFile('other.png', '#00ff00'));
    await expect.element(screen.getByRole('img', { name: 'other.png' })).toBeVisible();
    await totals(screen, '1 area & 1 image');

    await screen.getByRole('button', { name: 'Close wide.png' }).click();
    await expect.element(screen.getByText(/has picking areas that will be lost/)).toBeVisible();
    await screen.getByRole('button', { name: 'Close tab', exact: true }).click();
    await totals(screen, '0 areas & 0 images');
  });
});
