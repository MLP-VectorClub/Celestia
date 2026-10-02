import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

import { DialogProvider } from 'src/components/shared/dialogs/DialogProvider';
import { PickerTool } from 'src/components/tools/picker/PickerTool';

/** A real PNG of the given color, made by the browser */
async function pngFile(name: string, color: string, rightColor = color, size = { width: 4, height: 3 }): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.fillStyle = rightColor;
  ctx.fillRect(size.width / 2, 0, size.width / 2, size.height);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], name, { type: 'image/png' });
}

const statusText = (screen: Awaited<ReturnType<typeof render>>) => screen.getByRole('status').element().textContent ?? '';

const renderPicker = () =>
  render(
    <DialogProvider>
      <PickerTool />
    </DialogProvider>
  );

describe('PickerTool', () => {
  it('starts empty with a way to open an image', async () => {
    const screen = await renderPicker();
    await expect.element(screen.getByText(/drop image files here/)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Open an image…' })).toBeVisible();
  });

  it('opens a tab for each uploaded image and shows the first one as active', async () => {
    const screen = await renderPicker();
    await userEvent.upload(screen.getByLabelText('Open images'), [await pngFile('red.png', '#f00'), await pngFile('blue.png', '#00f')]);

    await expect.element(screen.getByRole('tab', { name: /red/ })).toBeVisible();
    await expect.element(screen.getByRole('tab', { name: /blue/ })).toBeVisible();
    // the last opened image is the active one
    await expect.element(screen.getByRole('tab', { name: /blue/ })).toHaveAttribute('aria-selected', 'true');
    await expect.element(screen.getByRole('img', { name: 'blue.png' })).toBeVisible();
  });

  it('does not open the same image twice, it switches to the existing tab', async () => {
    const screen = await renderPicker();
    await userEvent.upload(screen.getByLabelText('Open images'), [await pngFile('red.png', '#f00'), await pngFile('blue.png', '#00f')]);
    await expect.element(screen.getByRole('tab', { name: /blue/ })).toHaveAttribute('aria-selected', 'true');

    await userEvent.upload(screen.getByLabelText('Open images'), await pngFile('copy-of-red.png', '#f00'));
    await expect.element(screen.getByRole('tab', { name: /red/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab').elements()).toHaveLength(2);
  });

  it('closes a tab and falls back to the empty state', async () => {
    const screen = await renderPicker();
    await userEvent.upload(screen.getByLabelText('Open images'), await pngFile('red.png', '#f00'));
    await screen.getByRole('button', { name: 'Close red.png' }).click();
    await expect.element(screen.getByText(/drop image files here/)).toBeVisible();
  });

  it('reports files that are not images', async () => {
    const screen = await renderPicker();
    await userEvent.upload(screen.getByLabelText('Open images'), new File(['hello'], 'notes.png', { type: 'image/png' }));
    await expect.element(screen.getByText(/could not be read as an image/)).toBeVisible();
    await expect.element(screen.getByText(/drop image files here/)).toBeVisible();
  });
});

describe('PickerTool viewport', () => {
  const open = async (file: File) => {
    const screen = await renderPicker();
    await userEvent.upload(screen.getByLabelText('Open images'), file);
    await expect.element(screen.getByRole('img', { name: file.name })).toBeVisible();
    return screen;
  };
  const wide = () => pngFile('wide.png', '#ff0000', '#0000ff', { width: 100, height: 50 });

  it('fits the image when it opens and can show it at its original size', async () => {
    const screen = await open(await wide());
    const zoom = screen.getByLabelText('Zoom level');
    await expect.element(zoom).not.toHaveValue('100%');
    await screen.getByRole('button', { name: '100%' }).click();
    await expect.element(zoom).toHaveValue('100%');
  });

  it('zooms in steps and to a typed value, and ignores nonsense', async () => {
    const screen = await open(await wide());
    await screen.getByRole('button', { name: '100%' }).click();
    await screen.getByRole('button', { name: 'Zoom in' }).click();
    await expect.element(screen.getByLabelText('Zoom level')).toHaveValue('110%');

    await userEvent.fill(screen.getByLabelText('Zoom level'), '200');
    await userEvent.keyboard('{Enter}');
    await expect.element(screen.getByLabelText('Zoom level')).toHaveValue('200%');

    await userEvent.fill(screen.getByLabelText('Zoom level'), 'abc');
    await userEvent.keyboard('{Enter}');
    await expect.element(screen.getByLabelText('Zoom level')).toHaveValue('200%');
  });

  it('switches tools with the keyboard and fits or resets zoom with Ctrl+0 / Ctrl+1', async () => {
    const screen = await open(await wide());
    await userEvent.keyboard('z');
    await expect.element(screen.getByRole('button', { name: 'Zoom', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('h');
    await expect.element(screen.getByRole('button', { name: 'Hand' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.keyboard('{Control>}1{/Control}');
    await expect.element(screen.getByLabelText('Zoom level')).toHaveValue('100%');
    await userEvent.keyboard('{Control>}0{/Control}');
    await expect.element(screen.getByLabelText('Zoom level')).not.toHaveValue('100%');
  });

  it('reports the pixel and color under the pointer', async () => {
    const screen = await open(await wide());
    await screen.getByRole('button', { name: '100%' }).click();
    const stage = screen.getByRole('img', { name: 'wide.png' });
    const rect = stage.element().getBoundingClientRect();

    // the 100×50 image is centered at 100%: 25 px left of the middle is red, 25 px right is blue
    await userEvent.hover(stage, { position: { x: rect.width / 2 - 25, y: rect.height / 2 } });
    await expect.poll(() => statusText(screen)).toMatch(/25,25#ff0000 100%/);
    await userEvent.hover(stage, { position: { x: rect.width / 2 + 25, y: rect.height / 2 } });
    await expect.poll(() => statusText(screen)).toMatch(/75,25#0000ff 100%/);

    // outside the image there is no reading
    await userEvent.hover(stage, { position: { x: 5, y: 5 } });
    await expect.poll(() => statusText(screen)).not.toMatch(/#[0-9a-f]{6}/);
  });

  it('opens each image with its own zoom', async () => {
    const screen = await open(await wide());
    await screen.getByRole('button', { name: '100%' }).click();
    await userEvent.upload(screen.getByLabelText('Open images'), await pngFile('small.png', '#00ff00'));
    await expect.element(screen.getByRole('img', { name: 'small.png' })).toBeVisible();
    await expect.element(screen.getByLabelText('Zoom level')).not.toHaveValue('100%');
    await screen.getByRole('tab', { name: /wide/ }).click();
    await expect.element(screen.getByLabelText('Zoom level')).toHaveValue('100%');
  });

  it('zooms in with a click and out with Alt+click when the zoom tool is active', async () => {
    const screen = await open(await wide());
    await screen.getByRole('button', { name: '100%' }).click();
    await screen.getByRole('button', { name: 'Zoom', exact: true }).click();
    const stage = screen.getByRole('img', { name: 'wide.png' });
    await stage.click();
    await expect.element(screen.getByLabelText('Zoom level')).toHaveValue('110%');
    await stage.click({ modifiers: ['Alt'] });
    await expect.element(screen.getByLabelText('Zoom level')).toHaveValue('100%');
  });
});
