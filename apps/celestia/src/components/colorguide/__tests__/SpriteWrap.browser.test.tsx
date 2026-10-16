import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SpriteWrap } from 'src/components/colorguide/SpriteWrap';
import { DialogProvider } from 'src/components/shared/dialogs/DialogProvider';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

// next/image needs the app's router context, the picture itself is not what is tested here
vi.mock('src/components/colorguide/SpriteImage', () => ({ default: () => <img alt="sprite" /> }));

const renderWrap = (props: Partial<Parameters<typeof SpriteWrap>[0]>) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlTestProvider>
        <DialogProvider>
          <SpriteWrap appearanceId={5} sprite={{ hash: 'abc' } as never} {...props} />
        </DialogProvider>
      </IntlTestProvider>
    </QueryClientProvider>
  );

const MENU = { name: 'Sprite actions' };

describe('SpriteWrap menu', () => {
  it('gives everybody the entries that only read the sprite, linking the 600px image in a new tab', async () => {
    const screen = await renderWrap({ compact: true, editable: false });
    await screen.getByRole('button', MENU).click();

    const open = screen.getByRole('menuitem', { name: 'Open image in new tab' });
    await expect.element(open).toBeVisible();
    await expect.element(open).toHaveAttribute('href', expect.stringMatching(/\/appearances\/5\/sprite\?size=600&hash=abc$/));
    await expect.element(open).toHaveAttribute('target', '_blank');
    await expect.element(screen.getByRole('menuitem', { name: 'Copy image URL' })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { name: 'Upload new sprite' })).not.toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: 'Remove sprite image' })).not.toBeInTheDocument();
  });

  it('lets editors upload and remove too', async () => {
    const screen = await renderWrap({ compact: true, editable: true });
    await screen.getByRole('button', MENU).click();
    await expect.element(screen.getByRole('menuitem', { name: 'Upload new sprite' })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { name: 'Remove sprite image' })).toBeVisible();
  });

  it('offers editors an upload but no removal while there is no sprite', async () => {
    const screen = await renderWrap({ compact: true, editable: true, sprite: null });
    await screen.getByRole('button', MENU).click();
    await expect.element(screen.getByRole('menuitem', { name: 'Upload new sprite' })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { name: 'Remove sprite image' })).not.toBeInTheDocument();
  });

  it('opens the menu on a plain right click on the sprite, like the old context menu', async () => {
    const screen = await renderWrap({ compact: true, editable: true });
    const wrap = screen.getByTestId('sprite-wrap').element();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    wrap.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    await expect.element(screen.getByRole('menuitem', { name: 'Upload new sprite' })).toBeVisible();
  });

  it('leaves the browser menu alone when a modifier key is held', async () => {
    const screen = await renderWrap({ compact: true, editable: true });
    const wrap = screen.getByTestId('sprite-wrap').element();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, shiftKey: true });
    wrap.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    await expect.element(screen.getByRole('menuitem', { name: 'Upload new sprite' })).not.toBeInTheDocument();
  });

  it('has no menu for a visitor when there is no sprite to open', async () => {
    const screen = await renderWrap({ compact: true, editable: false, sprite: null });
    await expect.element(screen.getByRole('button', MENU)).not.toBeInTheDocument();
  });

  it('keeps the long hint for an empty sprite box out of the compact list item', async () => {
    const compact = await renderWrap({ compact: true, editable: true, sprite: null });
    await expect.element(compact.getByText(/No sprite yet/)).not.toBeInTheDocument();
    await compact.unmount();
    const full = await renderWrap({ editable: true, sprite: null });
    await expect.element(full.getByText(/No sprite yet/)).toBeVisible();
  });
});

describe('SpriteWrap outline', () => {
  const outline = async (props: Partial<Parameters<typeof SpriteWrap>[0]>) => {
    const screen = await renderWrap(props);
    const style = getComputedStyle(screen.getByTestId('sprite-wrap').element());
    return { width: style.borderTopWidth, style: style.borderTopStyle };
  };

  it('is dashed only where a file can be dropped to upload it', async () => {
    expect(await outline({ editable: true })).toEqual({ width: '2px', style: 'dashed' });
  });

  it('is dashed for an editor while there is no sprite too', async () => {
    expect(await outline({ editable: true, sprite: null })).toEqual({ width: '2px', style: 'dashed' });
  });

  it('is gone for visitors', async () => {
    expect((await outline({ editable: false })).style).toBe('none');
  });

  it('is gone for visitors in the guide list', async () => {
    expect((await outline({ editable: false, compact: true })).style).toBe('none');
  });

  it('keeps the menu and the centered sprite for visitors, who click it to see it bigger', async () => {
    const screen = await renderWrap({ editable: false });

    await expect.element(screen.getByRole('button', MENU)).toBeVisible();
    await expect
      .element(screen.getByTitle('Open image in new tab'))
      .toHaveAttribute('href', expect.stringMatching(/\/appearances\/5\/sprite\?size=600/));
    expect(screen.getByTestId('sprite-wrap').element().parentElement!.classList.contains('text-center')).toBe(true);
  });
});
