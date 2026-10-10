import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

import { EventEntryActions } from 'src/components/events/EventEntryActions';
import { DialogProvider } from 'src/components/shared/dialogs/DialogProvider';
import { EventEntriesService } from 'src/services/event-entries';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

vi.mock('src/services/event-entries', () => ({
  EventEntriesService: { get: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const service = vi.mocked(EventEntriesService);
const ok = <T,>(data: T) => Promise.resolve({ data }) as never;

const renderActions = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const screen = render(
    <QueryClientProvider client={client}>
      <IntlTestProvider>
        <DialogProvider>
          <EventEntryActions entryId={7} title="Seeded Entry" eventKey={['/events/3']} />
        </DialogProvider>
      </IntlTestProvider>
    </QueryClientProvider>
  );
  return { screen, invalidate };
};

beforeEach(() => {
  vi.resetAllMocks();
  service.get.mockReturnValue(ok({ link: 'http://fav.me/dabc123', title: 'Seeded Entry', prevSrc: null }));
  service.update.mockReturnValue(ok({}));
  service.remove.mockReturnValue(ok({}));
});

describe('EventEntryActions', () => {
  it('fills the edit form from the API and saves the changes, then refetches the event', async () => {
    const { screen, invalidate } = renderActions();
    await (await screen).getByRole('button', { name: 'Edit' }).click();

    const title = (await screen).getByLabelText('Title');
    await expect.element(title).toHaveValue('Seeded Entry');
    await expect.element((await screen).getByLabelText('Link to the submission')).toHaveValue('http://fav.me/dabc123');
    expect(service.get).toHaveBeenCalledWith(7);

    await userEvent.fill(title, 'Retitled Entry');
    await (await screen).getByRole('button', { name: 'Save' }).click();

    await vi.waitFor(() =>
      expect(service.update).toHaveBeenCalledWith(7, { link: 'http://fav.me/dabc123', title: 'Retitled Entry', prevSrc: null })
    );
    await vi.waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['/events/3'] }));
    await expect.element((await screen).getByLabelText('Title')).not.toBeInTheDocument();
  });

  it('sends a preview image only when one is filled in', async () => {
    const { screen } = renderActions();
    await (await screen).getByRole('button', { name: 'Edit' }).click();
    await expect.element((await screen).getByLabelText('Title')).toHaveValue('Seeded Entry');
    await userEvent.fill((await screen).getByLabelText('Preview image URL (optional)'), '  https://example.com/p.png ');
    await (await screen).getByRole('button', { name: 'Save' }).click();
    await vi.waitFor(() => expect(service.update.mock.calls[0][1].prevSrc).toBe('https://example.com/p.png'));
  });

  it('shows a validation error beside its field and keeps the dialog open', async () => {
    service.update.mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { message: 'invalid', errors: { title: ['Entry title must be between 2 and 64 characters long'] } } },
    });
    const { screen } = renderActions();
    await (await screen).getByRole('button', { name: 'Edit' }).click();
    await expect.element((await screen).getByLabelText('Title')).toHaveValue('Seeded Entry');
    await (await screen).getByRole('button', { name: 'Save' }).click();

    await expect.element((await screen).getByText('Entry title must be between 2 and 64 characters long')).toBeVisible();
    await expect.element((await screen).getByLabelText('Title')).toBeInTheDocument();
  });

  it('says so when the entry cannot be loaded', async () => {
    service.get.mockRejectedValue({ isAxiosError: true, response: { status: 403, data: { message: 'This event has ended' } } });
    const { screen } = renderActions();
    await (await screen).getByRole('button', { name: 'Edit' }).click();
    await expect.element((await screen).getByRole('alert')).toBeVisible();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('withdraws the entry only after it is confirmed', async () => {
    const { screen, invalidate } = renderActions();
    await (await screen).getByRole('button', { name: 'Withdraw' }).click();
    await expect.element((await screen).getByText(/withdraw “Seeded Entry”/)).toBeVisible();

    // Cancelling changes nothing
    await (await screen).getByTestId('dialog-btn-cancel').click();
    expect(service.remove).not.toHaveBeenCalled();

    await (await screen).getByRole('button', { name: 'Withdraw' }).click();
    await (await screen).getByTestId('dialog-btn-confirm').click();
    await vi.waitFor(() => expect(service.remove).toHaveBeenCalledWith(7));
    await vi.waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['/events/3'] }));
  });
});
