import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import ContactModal from 'src/components/ContactModal';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

vi.mock('react-redux', () => ({ useSelector: () => ({ contactOpen: true }) }));
vi.mock('src/store', () => ({ useAppDispatch: () => vi.fn() }));
vi.mock('src/store/slices', () => ({ coreActions: { toggleContact: vi.fn() } }));

describe('ContactModal', () => {
  it('says the DeviantArt group is watched less closely and not recommended', async () => {
    const screen = await render(
      <IntlTestProvider>
        <ContactModal />
      </IntlTestProvider>
    );

    await expect.element(screen.getByRole('link', { name: 'Send a note' })).toBeVisible();
    await expect.element(screen.getByText(/monitored less closely than the other options, so we don't recommend it/)).toBeVisible();
    // The other ways to reach out carry no such warning
    expect(document.body.textContent?.match(/recommend/g)).toHaveLength(1);
  });
});
