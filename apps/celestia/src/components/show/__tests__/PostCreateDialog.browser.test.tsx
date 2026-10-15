import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { DialogProvider } from 'src/components/shared/dialogs/DialogProvider';
import { PostCreateDialog } from 'src/components/show/PostCreateDialog';
import { PostService } from 'src/services/posts';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const renderDialog = (onMakeAnother = vi.fn()) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlTestProvider>
        <DialogProvider>
          <PostCreateDialog showId={1} kind="request" isOpen onClose={vi.fn()} onMakeAnother={onMakeAnother} />
        </DialogProvider>
      </IntlTestProvider>
    </QueryClientProvider>
  );

const post = async (screen: Awaited<ReturnType<typeof renderDialog>>) => {
  vi.spyOn(PostService, 'create').mockResolvedValue({ data: { id: 12 } } as never);
  await screen.getByLabelText('Description').fill('A request');
  await screen.getByRole('button', { name: 'Submit request' }).click();
};

describe('PostCreateDialog', () => {
  it('asks whether to view the new post or make another, like the old site', async () => {
    const screen = await renderDialog();
    await post(screen);
    await expect.element(screen.getByText('Request posted')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'View' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Make another' })).toBeVisible();
  });

  it('opens the form again for "Make another"', async () => {
    const onMakeAnother = vi.fn();
    const screen = await renderDialog(onMakeAnother);
    await post(screen);
    await screen.getByRole('button', { name: 'Make another' }).click();
    expect(onMakeAnother).toHaveBeenCalled();
  });
});
