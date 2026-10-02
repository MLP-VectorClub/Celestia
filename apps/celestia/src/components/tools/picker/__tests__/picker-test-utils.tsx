import { render } from 'vitest-browser-react';

import { DialogProvider } from 'src/components/shared/dialogs/DialogProvider';
import { PickerTool } from 'src/components/tools/picker/PickerTool';

/** A real PNG made by the browser: left half `color`, right half `rightColor` */
export async function pngFile(name: string, color: string, rightColor = color, size = { width: 4, height: 3 }): Promise<File> {
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

export const renderPicker = () =>
  render(
    <DialogProvider>
      <PickerTool />
    </DialogProvider>
  );

export type Screen = Awaited<ReturnType<typeof renderPicker>>;

export const statusText = (screen: Screen) => screen.getByRole('status').element().textContent ?? '';
