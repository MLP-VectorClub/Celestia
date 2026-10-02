import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

import { DialogProvider } from 'src/components/shared/dialogs/DialogProvider';
import { PickerTool } from 'src/components/tools/picker/PickerTool';

/** A real PNG of the given color, made by the browser */
async function pngFile(name: string, color: string): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 3;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 4, 3);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], name, { type: 'image/png' });
}

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
