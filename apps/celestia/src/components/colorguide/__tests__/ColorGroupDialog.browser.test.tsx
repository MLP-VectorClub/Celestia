import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ColorGroupDialog } from 'src/components/colorguide/ColorGroupDialog';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), create: vi.fn() }));

vi.mock('src/hooks', async () => ({
  ...(await vi.importActual<object>('src/hooks/mutation')),
  useConfig: () => ({ patterns: { hexColor: /^#[0-9a-f]{6}$/i } }),
}));
vi.mock('src/services/color-groups', () => ({ ColorGroupService: api }));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));

const group = {
  id: 9,
  label: 'Glasses',
  colors: [
    { id: 90, label: 'Frame', hex: '#000000', order: 1, opacity: null, blendMode: null },
    { id: 91, label: 'Lens', hex: '#336699', order: 2, opacity: 40, blendMode: 'overlay' },
  ],
};

const renderDialog = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <IntlTestProvider>
        <ColorGroupDialog appearanceId={3} groupId={9} isOpen onClose={() => undefined} />
      </IntlTestProvider>
    </QueryClientProvider>
  );

describe('ColorGroupDialog opacity and blend mode', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.get.mockResolvedValue({ data: group });
    api.update.mockResolvedValue({ data: {} });
  });

  it('shows them in the interactive editor and sends them back as they are', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByRole('spinbutton', { name: /Opacity of color 2/ })).toHaveValue(40);
    await expect.element(screen.getByRole('combobox', { name: /Blend mode of color 2/ })).toHaveValue('overlay');
    await screen.getByTestId('dialog-btn-save').click();

    expect(api.update).toHaveBeenCalledWith(
      9,
      expect.objectContaining({
        colors: [
          { id: 90, label: 'Frame', hex: '#000000', opacity: null, blendMode: null },
          { id: 91, label: 'Lens', hex: '#336699', opacity: 40, blendMode: 'overlay' },
        ],
      })
    );
  });

  it('writes them into the plain text list, reads edits to them back and clears what was taken out', async () => {
    const screen = await renderDialog();
    await expect.element(screen.getByRole('spinbutton', { name: /Opacity of color 2/ })).toBeVisible();

    await screen.getByRole('button', { name: 'Plain text editor' }).click();
    const text = screen.getByRole('textbox', { name: 'Plain text editor' });
    await expect.element(text).toHaveValue(expect.stringContaining('#336699\tLens\t40% overlay\tID:91'));

    // 55% instead of 40%, and no blend mode anymore (normal)
    await text.fill('#000000\tFrame\tID:90\n#336699\tLens\t55%\tID:91\n#FFFFFF\tShine\t20% screen\n');
    await screen.getByTestId('dialog-btn-save').click();

    expect(api.update).toHaveBeenCalledWith(
      9,
      expect.objectContaining({
        colors: [
          { id: 90, label: 'Frame', hex: '#000000', opacity: null, blendMode: null },
          { id: 91, label: 'Lens', hex: '#336699', opacity: 55, blendMode: null },
          { label: 'Shine', hex: '#FFFFFF', opacity: 20, blendMode: 'screen' },
        ],
      })
    );
  });

  it('keeps the settings when switching back from the text to the interactive editor', async () => {
    const screen = await renderDialog();
    await expect.element(screen.getByRole('spinbutton', { name: /Opacity of color 2/ })).toBeVisible();

    await screen.getByRole('button', { name: 'Plain text editor' }).click();
    await screen.getByRole('button', { name: 'Interactive editor' }).click();

    await expect.element(screen.getByRole('spinbutton', { name: /Opacity of color 2/ })).toHaveValue(40);
    await expect.element(screen.getByRole('combobox', { name: /Blend mode of color 2/ })).toHaveValue('overlay');
  });

  it('points out a setting it cannot read in the text', async () => {
    const screen = await renderDialog();
    await expect.element(screen.getByRole('spinbutton', { name: /Opacity of color 2/ })).toBeVisible();

    await screen.getByRole('button', { name: 'Plain text editor' }).click();
    await screen.getByRole('textbox', { name: 'Plain text editor' }).fill('#336699\tLens\t150%\n');
    await screen.getByTestId('dialog-btn-save').click();

    await expect.element(screen.getByText(/line 1/i)).toBeVisible();
    expect(api.update).not.toHaveBeenCalled();
  });
});
