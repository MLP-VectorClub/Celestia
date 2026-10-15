import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import Notices from 'src/components/shared/Notices';
import { NOTICE_PLACEHOLDERS } from 'src/config';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({ readOnly: false, loading: false }));

vi.mock('next/router', () => ({ useRouter: () => ({ isReady: true, asPath: '/cg', pathname: '/cg' }) }));
vi.mock('src/hooks', () => ({
  useConfig: () => ({ config: { readOnly: state.readOnly } }),
  useCurrentNotices: () => (state.loading ? undefined : [{ id: 1, type: 'info', messageHtml: 'Hello from <a href="{path}">here</a>' }]),
}));

const renderNotices = () =>
  render(
    <IntlTestProvider>
      <Notices />
    </IntlTestProvider>
  );

describe('Notices', () => {
  beforeEach(() => {
    state.readOnly = false;
    state.loading = false;
  });

  it('shows the notices of the site', async () => {
    const screen = await renderNotices();
    await expect.element(screen.getByText(/Hello from/)).toBeVisible();
    await expect.element(screen.getByText(/read-only right now/)).not.toBeInTheDocument();
  });

  it('tells visitors the site is read-only while the API says so', async () => {
    state.readOnly = true;
    const screen = await renderNotices();
    await expect.element(screen.getByText(/read-only right now/)).toBeVisible();
    await expect.element(screen.getByText(/Hello from/)).toBeVisible();
  });

  it('holds the place of the notices with a greyed-out skeleton while they load', async () => {
    state.loading = true;
    const screen = await renderNotices();
    const placeholders = screen.container.querySelectorAll('.notice-placeholder');
    expect(placeholders).toHaveLength(NOTICE_PLACEHOLDERS);
    expect(placeholders[0].classList.contains('alert-secondary')).toBe(true);
    expect(placeholders[0].querySelector('.placeholder')).not.toBeNull();
    await expect.element(screen.getByText(/Hello from/)).not.toBeInTheDocument();
  });

  it('drops the placeholders once the notices are in', async () => {
    const screen = await renderNotices();
    expect(screen.container.querySelector('.notice-placeholder')).toBeNull();
  });
});
